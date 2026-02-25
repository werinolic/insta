import '@fastify/cookie';
import { z } from 'zod';
import { eq, and, inArray, lt, desc, sql, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { db, posts, postMedia, users, follows, likes } from '@repo/db';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { createNotification, parseMentions } from '../lib/notifications';

const mediaInputSchema = z.object({
  key: z.string(),
  url: z.string(),
  thumbnailUrl: z.string(),
  mediumUrl: z.string(),
  order: z.number().int().min(0),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
});

export const postsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        caption: z.string().max(2200).optional(),
        media: z.array(mediaInputSchema).min(1).max(10),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const postId = crypto.randomUUID();

      await db.insert(posts).values({
        id: postId,
        userId: ctx.userId,
        caption: input.caption ?? null,
      });

      await db.insert(postMedia).values(
        input.media.map((m) => ({
          id: crypto.randomUUID(),
          postId,
          url: m.url,
          thumbnailUrl: m.thumbnailUrl,
          mediumUrl: m.mediumUrl,
          order: m.order,
          width: m.width,
          height: m.height,
        })),
      );

      if (input.caption) {
        const usernames = parseMentions(input.caption);
        if (usernames.length > 0) {
          const mentionedUsers = await db
            .select({ id: users.id, username: users.username })
            .from(users)
            .where(inArray(users.username, usernames));

          await Promise.all(
            mentionedUsers.map((u) =>
              createNotification({
                recipientId: u.id,
                actorId: ctx.userId,
                type: 'mention',
                postId,
              }),
            ),
          );
        }
      }

      return { postId };
    }),

  feed: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(12),
      }),
    )
    .query(async ({ input, ctx }) => {
      const followingIds = await db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, ctx.userId));

      const authorIds = [...followingIds.map((f) => f.followingId), ctx.userId];

      const cursorPost = input.cursor
        ? await db.select({ createdAt: posts.createdAt }).from(posts).where(eq(posts.id, input.cursor)).limit(1)
        : null;

      const feedPosts = await db
        .select({
          id: posts.id,
          caption: posts.caption,
          createdAt: posts.createdAt,
          userId: posts.userId,
          username: users.username,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
          likeCount: sql<number>`count(distinct ${likes.userId})`,
        })
        .from(posts)
        .innerJoin(users, eq(users.id, posts.userId))
        .leftJoin(likes, eq(likes.postId, posts.id))
        .where(
          and(
            inArray(posts.userId, authorIds),
            isNull(posts.archivedAt),
            cursorPost?.[0] ? lt(posts.createdAt, cursorPost[0].createdAt) : undefined,
          ),
        )
        .groupBy(posts.id, users.id)
        .orderBy(desc(posts.createdAt))
        .limit(input.limit + 1);

      const hasMore = feedPosts.length > input.limit;
      const items = hasMore ? feedPosts.slice(0, input.limit) : feedPosts;

      const postIds = items.map((p) => p.id);
      const media =
        postIds.length > 0
          ? await db
              .select()
              .from(postMedia)
              .where(inArray(postMedia.postId, postIds))
              .orderBy(postMedia.order)
          : [];

      const viewerLikes =
        postIds.length > 0
          ? await db
              .select({ postId: likes.postId })
              .from(likes)
              .where(and(eq(likes.userId, ctx.userId), inArray(likes.postId, postIds)))
          : [];
      const likedSet = new Set(viewerLikes.map((l) => l.postId));

      const result = items.map((p) => ({
        ...p,
        likeCount: Number(p.likeCount),
        likedByViewer: likedSet.has(p.id),
        media: media.filter((m) => m.postId === p.id),
      }));

      return {
        items: result,
        nextCursor: hasMore ? items[items.length - 1].id : undefined,
      };
    }),

  byId: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input, ctx }) => {
      const [post] = await db
        .select({
          id: posts.id,
          caption: posts.caption,
          createdAt: posts.createdAt,
          userId: posts.userId,
          archivedAt: posts.archivedAt,
          username: users.username,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
          likeCount: sql<number>`count(distinct ${likes.userId})`,
        })
        .from(posts)
        .innerJoin(users, eq(users.id, posts.userId))
        .leftJoin(likes, eq(likes.postId, posts.id))
        .where(eq(posts.id, input.postId))
        .groupBy(posts.id, users.id)
        .limit(1);

      if (!post) throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });

      // Archived posts are only visible to the owner
      if (post.archivedAt && post.userId !== ctx.userId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      }

      const media = await db
        .select()
        .from(postMedia)
        .where(eq(postMedia.postId, input.postId))
        .orderBy(postMedia.order);

      const likedByViewer = ctx.userId
        ? (
            await db
              .select()
              .from(likes)
              .where(and(eq(likes.userId, ctx.userId), eq(likes.postId, input.postId)))
              .limit(1)
          ).length > 0
        : false;

      return {
        ...post,
        likeCount: Number(post.likeCount),
        likedByViewer,
        media,
        isArchived: post.archivedAt !== null,
      };
    }),

  byUsername: publicProcedure
    .input(
      z.object({
        username: z.string(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(12),
      }),
    )
    .query(async ({ input }) => {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      const cursorPost = input.cursor
        ? await db.select({ createdAt: posts.createdAt }).from(posts).where(eq(posts.id, input.cursor)).limit(1)
        : null;

      const rows = await db
        .select({
          id: posts.id,
          createdAt: posts.createdAt,
          thumbnailUrl: sql<string>`(
            select pm.thumbnail_url from post_media pm
            where pm.post_id = ${posts.id}
            order by pm."order" asc
            limit 1
          )`,
        })
        .from(posts)
        .where(
          and(
            eq(posts.userId, user.id),
            isNull(posts.archivedAt),
            cursorPost?.[0] ? lt(posts.createdAt, cursorPost[0].createdAt) : undefined,
          ),
        )
        .orderBy(desc(posts.createdAt))
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, input.limit) : rows;

      return { items, nextCursor: hasMore ? items[items.length - 1].id : undefined };
    }),

  // Toggle archive on/off for own post
  archive: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [post] = await db
        .select({ userId: posts.userId, archivedAt: posts.archivedAt })
        .from(posts)
        .where(eq(posts.id, input.postId))
        .limit(1);

      if (!post) throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      if (post.userId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your post' });
      }

      const nowArchived = post.archivedAt === null;
      await db
        .update(posts)
        .set({ archivedAt: nowArchived ? new Date() : null })
        .where(eq(posts.id, input.postId));

      return { isArchived: nowArchived };
    }),

  // List the owner's archived posts (private — only for the authenticated user)
  archived: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(12),
      }),
    )
    .query(async ({ input, ctx }) => {
      const cursorPost = input.cursor
        ? await db.select({ createdAt: posts.createdAt }).from(posts).where(eq(posts.id, input.cursor)).limit(1)
        : null;

      const rows = await db
        .select({
          id: posts.id,
          caption: posts.caption,
          createdAt: posts.createdAt,
          archivedAt: posts.archivedAt,
          thumbnailUrl: sql<string>`(
            select pm.thumbnail_url from post_media pm
            where pm.post_id = ${posts.id}
            order by pm."order" asc
            limit 1
          )`,
        })
        .from(posts)
        .where(
          and(
            eq(posts.userId, ctx.userId),
            sql`${posts.archivedAt} is not null`,
            cursorPost?.[0] ? lt(posts.createdAt, cursorPost[0].createdAt) : undefined,
          ),
        )
        .orderBy(desc(posts.archivedAt))
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, input.limit) : rows;

      return { items, nextCursor: hasMore ? items[items.length - 1].id : undefined };
    }),

  delete: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [post] = await db
        .select({ userId: posts.userId })
        .from(posts)
        .where(eq(posts.id, input.postId))
        .limit(1);

      if (!post) throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      if (post.userId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your post' });
      }

      await db.delete(posts).where(eq(posts.id, input.postId));
      return { success: true };
    }),
});
