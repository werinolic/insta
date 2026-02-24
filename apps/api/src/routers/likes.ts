import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { db, likes, posts, users } from '@repo/db';
import { router, protectedProcedure } from '../trpc';
import { createNotification } from '../lib/notifications';

// In-memory like count subscribers: postId → set of listeners
const likeSubscribers = new Map<string, Set<(count: number) => void>>();

function emitLikeCount(postId: string, count: number) {
  likeSubscribers.get(postId)?.forEach((fn) => fn(count));
}

async function getLikeCount(postId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(likes)
    .where(eq(likes.postId, postId));
  return Number(row?.count ?? 0);
}

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
        const count = await getLikeCount(input.postId);
        emitLikeCount(input.postId, count);
        return { liked: false, likeCount: count };
      }

      await db.insert(likes).values({ userId: ctx.userId, postId: input.postId });

      await createNotification({
        recipientId: post.userId,
        actorId: ctx.userId,
        type: 'like',
        postId: input.postId,
      });

      const count = await getLikeCount(input.postId);
      emitLikeCount(input.postId, count);
      return { liked: true, likeCount: count };
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
      const rows = await db
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

  subscribeCount: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .subscription(async function* ({ input }) {
      // Emit current count immediately
      yield { likeCount: await getLikeCount(input.postId) };

      const queue: number[] = [];
      let resolve: (() => void) | null = null;

      const handler = (count: number) => {
        queue.push(count);
        resolve?.();
      };

      if (!likeSubscribers.has(input.postId)) {
        likeSubscribers.set(input.postId, new Set());
      }
      likeSubscribers.get(input.postId)!.add(handler);

      try {
        while (true) {
          if (queue.length > 0) {
            yield { likeCount: queue.shift()! };
          } else {
            await new Promise<void>((r) => { resolve = r; });
            resolve = null;
          }
        }
      } finally {
        likeSubscribers.get(input.postId)?.delete(handler);
      }
    }),
});
