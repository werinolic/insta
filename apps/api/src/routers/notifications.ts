import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db, notifications, users } from '@repo/db';
import { router, protectedProcedure } from '../trpc';
import { registerNotificationEmitter } from '../lib/notifications';
import type { NotificationPayload } from '../lib/notifications';

// In-memory SSE subscriber map: userId → set of listeners
const notifSubscribers = new Map<string, Set<(n: NotificationPayload) => void>>();

function emitNotification(recipientId: string, payload: NotificationPayload) {
  notifSubscribers.get(recipientId)?.forEach((fn) => fn(payload));
}

// Wire emitter into the shared lib so createNotification() pushes via SSE
registerNotificationEmitter(emitNotification);

export const notificationsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(30),
      }),
    )
    .query(async ({ input, ctx }) => {
      const rows = await db
        .select({
          id: notifications.id,
          type: notifications.type,
          read: notifications.read,
          postId: notifications.postId,
          commentId: notifications.commentId,
          createdAt: notifications.createdAt,
          actorId: users.id,
          actorUsername: users.username,
          actorAvatarUrl: users.avatarUrl,
        })
        .from(notifications)
        .innerJoin(users, eq(users.id, notifications.actorId))
        .where(eq(notifications.recipientId, ctx.userId))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, input.limit) : rows;

      return { items, nextCursor: hasMore ? items[items.length - 1].id : undefined };
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.recipientId, ctx.userId), eq(notifications.read, false)));

    return { count: Number(row?.count ?? 0) };
  }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.recipientId, ctx.userId), eq(notifications.read, false)));

    return { success: true };
  }),

  subscribe: protectedProcedure.subscription(async function* ({ ctx }) {
    const queue: NotificationPayload[] = [];
    let resolve: (() => void) | null = null;

    const handler = (payload: NotificationPayload) => {
      queue.push(payload);
      resolve?.();
    };

    if (!notifSubscribers.has(ctx.userId)) {
      notifSubscribers.set(ctx.userId, new Set());
    }
    notifSubscribers.get(ctx.userId)!.add(handler);

    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          await new Promise<void>((r) => {
            resolve = r;
          });
          resolve = null;
        }
      }
    } finally {
      notifSubscribers.get(ctx.userId)?.delete(handler);
    }
  }),
});
