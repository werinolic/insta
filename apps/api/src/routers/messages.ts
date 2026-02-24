import { z } from 'zod';
import { eq, and, desc, lt } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { db, messages, conversationMembers, messageReads, conversations, users } from '@repo/db';
import { router, protectedProcedure } from '../trpc';
import { createNotification } from '../lib/notifications';

// In-memory subscription map for WS message delivery
// In production this would be backed by Redis pub/sub
const subscribers = new Map<string, Set<(msg: MessagePayload) => void>>();

interface MessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  type: string;
  text: string | null;
  mediaUrl: string | null;
  sharedPostId: string | null;
  createdAt: Date;
  isTyping?: boolean;
}

function emit(conversationId: string, payload: MessagePayload) {
  subscribers.get(conversationId)?.forEach((fn) => fn(payload));
}

async function assertMember(conversationId: string, userId: string) {
  const [row] = await db
    .select({ conversationId: conversationMembers.conversationId })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!row) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a member of this conversation' });
}

export const messagesRouter = router({
  history: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(30),
      }),
    )
    .query(async ({ input, ctx }) => {
      await assertMember(input.conversationId, ctx.userId);

      const cursorMsg = input.cursor
        ? await db
            .select({ createdAt: messages.createdAt })
            .from(messages)
            .where(eq(messages.id, input.cursor))
            .limit(1)
        : null;

      const rows = await db
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          type: messages.type,
          text: messages.text,
          mediaUrl: messages.mediaUrl,
          sharedPostId: messages.sharedPostId,
          createdAt: messages.createdAt,
          senderUsername: users.username,
          senderAvatarUrl: users.avatarUrl,
        })
        .from(messages)
        .innerJoin(users, eq(users.id, messages.senderId))
        .where(
          and(
            eq(messages.conversationId, input.conversationId),
            cursorMsg?.[0] ? lt(messages.createdAt, cursorMsg[0].createdAt) : undefined,
          ),
        )
        .orderBy(desc(messages.createdAt))
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, input.limit) : rows;

      // Mark as read
      const unread = items.filter((m) => m.senderId !== ctx.userId);
      if (unread.length > 0) {
        await db
          .insert(messageReads)
          .values(unread.map((m) => ({ messageId: m.id, userId: ctx.userId })))
          .onConflictDoNothing();
      }

      return { items: items.reverse(), nextCursor: hasMore ? items[items.length - 1].id : undefined };
    }),

  send: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        type: z.enum(['text', 'photo', 'post_share']).default('text'),
        text: z.string().min(1).max(2000).optional(),
        mediaUrl: z.string().optional(),
        sharedPostId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await assertMember(input.conversationId, ctx.userId);

      if (input.type === 'text' && !input.text) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Text is required for text messages' });
      }

      const [sender] = await db
        .select({ username: users.username })
        .from(users)
        .where(eq(users.id, ctx.userId))
        .limit(1);

      const msgId = crypto.randomUUID();
      const [msg] = await db
        .insert(messages)
        .values({
          id: msgId,
          conversationId: input.conversationId,
          senderId: ctx.userId,
          type: input.type,
          text: input.text ?? null,
          mediaUrl: input.mediaUrl ?? null,
          sharedPostId: input.sharedPostId ?? null,
        })
        .returning();

      // Update conversation updatedAt
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, input.conversationId));

      const payload: MessagePayload = {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        senderUsername: sender?.username ?? '',
        type: msg.type,
        text: msg.text,
        mediaUrl: msg.mediaUrl,
        sharedPostId: msg.sharedPostId,
        createdAt: msg.createdAt,
      };

      emit(input.conversationId, payload);

      // Notify other members
      const otherMembers = await db
        .select({ userId: conversationMembers.userId })
        .from(conversationMembers)
        .where(
          and(
            eq(conversationMembers.conversationId, input.conversationId),
          ),
        );

      await Promise.all(
        otherMembers
          .filter((m) => m.userId !== ctx.userId)
          .map((m) =>
            createNotification({
              recipientId: m.userId,
              actorId: ctx.userId,
              type: 'message',
            }),
          ),
      );

      return msg;
    }),

  typing: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await assertMember(input.conversationId, ctx.userId);

      const [sender] = await db
        .select({ username: users.username })
        .from(users)
        .where(eq(users.id, ctx.userId))
        .limit(1);

      emit(input.conversationId, {
        id: '',
        conversationId: input.conversationId,
        senderId: ctx.userId,
        senderUsername: sender?.username ?? '',
        type: 'typing',
        text: null,
        mediaUrl: null,
        sharedPostId: null,
        createdAt: new Date(),
        isTyping: true,
      });

      return { success: true };
    }),

  subscribe: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .subscription(async function* ({ input, ctx }) {
      await assertMember(input.conversationId, ctx.userId);

      const queue: MessagePayload[] = [];
      let resolve: (() => void) | null = null;

      const handler = (msg: MessagePayload) => {
        if (msg.senderId === ctx.userId) return;
        queue.push(msg);
        resolve?.();
      };

      if (!subscribers.has(input.conversationId)) {
        subscribers.set(input.conversationId, new Set());
      }
      subscribers.get(input.conversationId)!.add(handler);

      try {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift()!;
          } else {
            await new Promise<void>((r) => { resolve = r; });
            resolve = null;
          }
        }
      } finally {
        subscribers.get(input.conversationId)?.delete(handler);
      }
    }),
});
