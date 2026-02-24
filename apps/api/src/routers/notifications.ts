import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db, notifications, users } from '@repo/db';
import { router, protectedProcedure } from '../trpc';

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
    const rows = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.recipientId, ctx.userId), eq(notifications.read, false)));

    return { count: rows.length };
  }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.recipientId, ctx.userId), eq(notifications.read, false)));

    return { success: true };
  }),
});
