import { z } from 'zod';
import { eq, like, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { db, users, follows, posts } from '@repo/db';
import { router, publicProcedure } from '../trpc';

function toSafeUser(user: typeof users.$inferSelect) {
  const { passwordHash: _ph, ...safe } = user;
  return safe;
}

export const usersRouter = router({
  byUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input, ctx }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const [counts] = await db
        .select({
          followers: sql<number>`count(distinct case when ${follows.followingId} = ${user.id} then ${follows.followerId} end)`,
          following: sql<number>`count(distinct case when ${follows.followerId} = ${user.id} then ${follows.followingId} end)`,
          posts: sql<number>`count(distinct ${posts.id})`,
        })
        .from(follows)
        .fullJoin(posts, eq(posts.userId, user.id))
        .where(eq(follows.followerId, user.id));

      const isFollowing = ctx.userId
        ? (await db
            .select({ followerId: follows.followerId })
            .from(follows)
            .where(eq(follows.followerId, ctx.userId))
            .limit(1)
          ).length > 0
        : false;

      return {
        ...toSafeUser(user),
        followerCount: Number(counts?.followers ?? 0),
        followingCount: Number(counts?.following ?? 0),
        postCount: Number(counts?.posts ?? 0),
        isFollowing,
      };
    }),

  search: publicProcedure
    .input(z.object({ query: z.string().min(1).max(50) }))
    .query(async ({ input }) => {
      const results = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(like(users.username, `%${input.query}%`))
        .limit(20);

      return results;
    }),

  followers: publicProcedure
    .input(
      z.object({
        username: z.string(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(30),
      }),
    )
    .query(async ({ input }) => {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      const rows = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
          followedAt: follows.createdAt,
        })
        .from(follows)
        .innerJoin(users, eq(users.id, follows.followerId))
        .where(eq(follows.followingId, user.id))
        .orderBy(follows.createdAt)
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, input.limit) : rows;
      const nextCursor = hasMore ? items[items.length - 1].id : undefined;

      return { items, nextCursor };
    }),

  following: publicProcedure
    .input(
      z.object({
        username: z.string(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(30),
      }),
    )
    .query(async ({ input }) => {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      const rows = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
          followedAt: follows.createdAt,
        })
        .from(follows)
        .innerJoin(users, eq(users.id, follows.followingId))
        .where(eq(follows.followerId, user.id))
        .orderBy(follows.createdAt)
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, input.limit) : rows;
      const nextCursor = hasMore ? items[items.length - 1].id : undefined;

      return { items, nextCursor };
    }),
});
