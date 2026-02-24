import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { db, likes, posts } from '@repo/db';
import { router, protectedProcedure } from '../trpc';
import { createNotification } from '../lib/notifications';

export const likesRouter = router({
  toggle: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [post] = await db
        .select({ userId: posts.userId })
        .from(posts)
        .where(eq(posts.id, input.postId))
        .limit(1);

      if (!post) throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });

      const [existing] = await db
        .select()
        .from(likes)
        .where(and(eq(likes.userId, ctx.userId), eq(likes.postId, input.postId)))
        .limit(1);

      if (existing) {
        await db
          .delete(likes)
          .where(and(eq(likes.userId, ctx.userId), eq(likes.postId, input.postId)));
        return { liked: false };
      }

      await db.insert(likes).values({ userId: ctx.userId, postId: input.postId });

      await createNotification({
        recipientId: post.userId,
        actorId: ctx.userId,
        type: 'like',
        postId: input.postId,
      });

      return { liked: true };
    }),

  likedBy: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ input }) => {
      const { db: drizzleDb, users } = await import('@repo/db');
      const rows = await drizzleDb
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
          likedAt: likes.createdAt,
        })
        .from(likes)
        .innerJoin(users, eq(users.id, likes.userId))
        .where(eq(likes.postId, input.postId))
        .orderBy(likes.createdAt)
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, input.limit) : rows;
      return { items, nextCursor: hasMore ? items[items.length - 1].id : undefined };
    }),
});
