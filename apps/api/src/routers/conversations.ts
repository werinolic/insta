import '@fastify/cookie';
import { z } from 'zod';
import { eq, and, inArray, desc, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { db, conversations, conversationMembers, users } from '@repo/db';
import { router, protectedProcedure } from '../trpc';

export const conversationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberRows = await db
      .select({ conversationId: conversationMembers.conversationId })
      .from(conversationMembers)
      .where(eq(conversationMembers.userId, ctx.userId));

    const convIds = memberRows.map((r) => r.conversationId);
    if (convIds.length === 0) return [];

    const convRows = await db
      .select({
        id: conversations.id,
        name: conversations.name,
        isGroup: conversations.isGroup,
        updatedAt: conversations.updatedAt,
        lastMessageText: sql<string | null>`(
          select m.text from messages m
          where m.conversation_id = ${conversations.id}
          order by m.created_at desc limit 1
        )`,
        lastMessageAt: sql<Date | null>`(
          select m.created_at from messages m
          where m.conversation_id = ${conversations.id}
          order by m.created_at desc limit 1
        )`,
        unreadCount: sql<number>`(
          select count(*) from messages m
          where m.conversation_id = ${conversations.id}
          and m.sender_id != ${ctx.userId}
          and not exists (
            select 1 from message_reads mr
            where mr.message_id = m.id and mr.user_id = ${ctx.userId}
          )
        )`,
      })
      .from(conversations)
      .where(inArray(conversations.id, convIds))
      .orderBy(desc(conversations.updatedAt));

    // Attach members for each conversation
    const allMembers = await db
      .select({
        conversationId: conversationMembers.conversationId,
        userId: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        isAdmin: conversationMembers.isAdmin,
      })
      .from(conversationMembers)
      .innerJoin(users, eq(users.id, conversationMembers.userId))
      .where(inArray(conversationMembers.conversationId, convIds));

    return convRows.map((c) => ({
      ...c,
      unreadCount: Number(c.unreadCount),
      members: allMembers.filter((m) => m.conversationId === c.id),
    }));
  }),

  create: protectedProcedure
    .input(
      z.object({
        memberUsernames: z.array(z.string()).min(1).max(31),
        name: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const targetUsers = await db
        .select({ id: users.id, username: users.username })
        .from(users)
        .where(inArray(users.username, input.memberUsernames));

      if (targetUsers.length !== input.memberUsernames.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'One or more users not found' });
      }

      const allMemberIds = [...new Set([ctx.userId, ...targetUsers.map((u) => u.id)])];

      if (allMemberIds.length > 32) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Group chat limit is 32 members' });
      }

      const isGroup = allMemberIds.length > 2;

      // For DMs, reuse existing conversation if one exists
      if (!isGroup) {
        const existing = await db
          .select({ conversationId: conversationMembers.conversationId })
          .from(conversationMembers)
          .where(eq(conversationMembers.userId, ctx.userId));

        const existingIds = existing.map((e) => e.conversationId);

        if (existingIds.length > 0) {
          const otherMember = targetUsers[0];
          const shared = await db
            .select({ conversationId: conversationMembers.conversationId })
            .from(conversationMembers)
            .where(
              and(
                eq(conversationMembers.userId, otherMember.id),
                inArray(conversationMembers.conversationId, existingIds),
              ),
            )
            .limit(1);

          if (shared.length > 0) {
            return { conversationId: shared[0].conversationId, isNew: false };
          }
        }
      }

      const convId = crypto.randomUUID();
      await db.insert(conversations).values({
        id: convId,
        name: isGroup ? (input.name ?? null) : null,
        isGroup,
      });

      await db.insert(conversationMembers).values(
        allMemberIds.map((uid) => ({
          conversationId: convId,
          userId: uid,
          isAdmin: uid === ctx.userId,
        })),
      );

      return { conversationId: convId, isNew: true };
    }),

  addMember: protectedProcedure
    .input(z.object({ conversationId: z.string(), username: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [membership] = await db
        .select({ isAdmin: conversationMembers.isAdmin })
        .from(conversationMembers)
        .where(
          and(
            eq(conversationMembers.conversationId, input.conversationId),
            eq(conversationMembers.userId, ctx.userId),
          ),
        )
        .limit(1);

      if (!membership) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a member' });
      if (!membership.isAdmin) throw new TRPCError({ code: 'FORBIDDEN', message: 'Must be admin' });

      const memberCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(conversationMembers)
        .where(eq(conversationMembers.conversationId, input.conversationId));

      if (Number(memberCount[0]?.count ?? 0) >= 32) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Group chat limit is 32 members' });
      }

      const [target] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      await db
        .insert(conversationMembers)
        .values({ conversationId: input.conversationId, userId: target.id, isAdmin: false })
        .onConflictDoNothing();

      return { success: true };
    }),

  removeMember: protectedProcedure
    .input(z.object({ conversationId: z.string(), username: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [membership] = await db
        .select({ isAdmin: conversationMembers.isAdmin })
        .from(conversationMembers)
        .where(
          and(
            eq(conversationMembers.conversationId, input.conversationId),
            eq(conversationMembers.userId, ctx.userId),
          ),
        )
        .limit(1);

      if (!membership) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a member' });
      if (!membership.isAdmin) throw new TRPCError({ code: 'FORBIDDEN', message: 'Must be admin' });

      const [target] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      await db
        .delete(conversationMembers)
        .where(
          and(
            eq(conversationMembers.conversationId, input.conversationId),
            eq(conversationMembers.userId, target.id),
          ),
        );

      return { success: true };
    }),
});
