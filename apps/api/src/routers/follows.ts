import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { db, follows, users } from '@repo/db';
import { router, protectedProcedure } from '../trpc';
import { createNotification } from '../lib/notifications';

export const followsRouter = router({
  follow: protectedProcedure
    .input(z.object({ username: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [target] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      if (target.id === ctx.userId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot follow yourself' });
      }

      await db
        .insert(follows)
        .values({ followerId: ctx.userId, followingId: target.id })
        .onConflictDoNothing();

      await createNotification({
        recipientId: target.id,
        actorId: ctx.userId,
        type: 'follow',
      });

      return { success: true };
    }),

  unfollow: protectedProcedure
    .input(z.object({ username: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [target] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      await db
        .delete(follows)
        .where(and(eq(follows.followerId, ctx.userId), eq(follows.followingId, target.id)));

      return { success: true };
    }),
});
