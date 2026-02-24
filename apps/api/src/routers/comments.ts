import { z } from 'zod';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { db, comments, posts, users } from '@repo/db';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { createNotification, parseMentions } from '../lib/notifications';

export const commentsRouter = router({
  list: publicProcedure
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
          id: comments.id,
          text: comments.text,
          parentId: comments.parentId,
          createdAt: comments.createdAt,
          userId: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl,
        })
        .from(comments)
        .innerJoin(users, eq(users.id, comments.userId))
        .where(
          and(
            eq(comments.postId, input.postId),
            input.cursor ? asc(comments.createdAt) : undefined,
          ),
        )
        .orderBy(asc(comments.createdAt))
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, input.limit) : rows;

      // Nest replies under their parents
      const topLevel = items.filter((c) => !c.parentId);
      const replies = items.filter((c) => c.parentId);
      const nested = topLevel.map((c) => ({
        ...c,
        replies: replies.filter((r) => r.parentId === c.id),
      }));

      return { items: nested, nextCursor: hasMore ? items[items.length - 1].id : undefined };
    }),

  create: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        text: z.string().min(1).max(2200),
        parentId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [post] = await db
        .select({ userId: posts.userId })
        .from(posts)
        .where(eq(posts.id, input.postId))
        .limit(1);

      if (!post) throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });

      if (input.parentId) {
        const [parent] = await db
          .select({ id: comments.id, parentId: comments.parentId })
          .from(comments)
          .where(eq(comments.id, input.parentId))
          .limit(1);

        if (!parent) throw new TRPCError({ code: 'NOT_FOUND', message: 'Parent comment not found' });
        if (parent.parentId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot reply to a reply' });
        }
      }

      const commentId = crypto.randomUUID();
      const [comment] = await db
        .insert(comments)
        .values({
          id: commentId,
          postId: input.postId,
          userId: ctx.userId,
          parentId: input.parentId ?? null,
          text: input.text,
        })
        .returning();

      // Notify post owner of comment (if not self)
      await createNotification({
        recipientId: post.userId,
        actorId: ctx.userId,
        type: 'comment',
        postId: input.postId,
        commentId,
      });

      // Notify @mentioned users
      const usernames = parseMentions(input.text);
      if (usernames.length > 0) {
        const mentionedUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(inArray(users.username, usernames));

        await Promise.all(
          mentionedUsers.map((u) =>
            createNotification({
              recipientId: u.id,
              actorId: ctx.userId,
              type: 'mention',
              postId: input.postId,
              commentId,
            }),
          ),
        );
      }

      return comment;
    }),

  delete: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [comment] = await db
        .select({ userId: comments.userId })
        .from(comments)
        .where(eq(comments.id, input.commentId))
        .limit(1);

      if (!comment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment not found' });
      if (comment.userId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your comment' });
      }

      await db.delete(comments).where(eq(comments.id, input.commentId));
      return { success: true };
    }),
});
