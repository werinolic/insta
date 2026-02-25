import '@fastify/cookie';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db, users, sessions } from '@repo/db';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '@repo/shared';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { signAccessToken, sessionCookieOptions, sessionExpiry } from '../lib/auth';

type UserRow = typeof users.$inferSelect;

function toSafeUser(user: UserRow) {
  const { passwordHash: _ph, ...safe } = user;
  return safe;
}

export const authRouter = router({
  // Exchanges a valid session cookie for a fresh access token
  refresh: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.sessionId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No session' });
    }

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, ctx.sessionId))
      .limit(1);

    if (!session || session.expiresAt < new Date()) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Session expired' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not found' });

    const accessToken = await signAccessToken(user.id);
    return { accessToken, user: toSafeUser(user) };
  }),

  // Mobile: takes sessionId as input (cannot use httpOnly cookies in React Native)
  refreshMobile: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.sessionId))
        .limit(1);

      if (!session || session.expiresAt < new Date()) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Session expired' });
      }

      const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
      if (!user) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not found' });

      const accessToken = await signAccessToken(user.id);
      return { accessToken, user: toSafeUser(user) };
    }),

  register: publicProcedure.input(registerSchema).mutation(async ({ input, ctx }) => {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email, input.email), eq(users.username, input.username)))
      .limit(1);

    if (existing.length > 0) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Email or username already taken' });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const userId = crypto.randomUUID();

    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        email: input.email,
        username: input.username,
        passwordHash,
        fullName: input.fullName ?? null,
      })
      .returning();

    const expiresAt = sessionExpiry(30);
    const sessionId = crypto.randomUUID();

    await db.insert(sessions).values({ id: sessionId, userId, expiresAt });

    const accessToken = await signAccessToken(userId);
    ctx.res.setCookie('session_id', sessionId, sessionCookieOptions(expiresAt));

    return { accessToken, sessionId, user: toSafeUser(user) };
  }),

  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, input.emailOrUsername), eq(users.username, input.emailOrUsername)))
      .limit(1);

    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    const expiresAt = sessionExpiry(30);
    const sessionId = crypto.randomUUID();

    await db.insert(sessions).values({ id: sessionId, userId: user.id, expiresAt });

    const accessToken = await signAccessToken(user.id);
    ctx.res.setCookie('session_id', sessionId, sessionCookieOptions(expiresAt));

    return { accessToken, sessionId, user: toSafeUser(user) };
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.sessionId) {
      await db.delete(sessions).where(eq(sessions.id, ctx.sessionId));
    }
    ctx.res.clearCookie('session_id', { path: '/' });
    return { success: true };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await db.select().from(users).where(eq(users.id, ctx.userId)).limit(1);

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    return toSafeUser(user);
  }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ input, ctx }) => {
      const [user] = await db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, ctx.userId))
        .returning();

      return toSafeUser(user);
    }),

  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ input, ctx }) => {
      const [user] = await db.select().from(users).where(eq(users.id, ctx.userId)).limit(1);

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Current password is incorrect' });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 12);

      await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, ctx.userId));

      // Invalidate all sessions so user must re-login
      await db.delete(sessions).where(eq(sessions.userId, ctx.userId));

      return { success: true };
    }),

  deleteAccount: protectedProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [user] = await db.select().from(users).where(eq(users.id, ctx.userId)).limit(1);
      if (!user) throw new TRPCError({ code: 'NOT_FOUND' });

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Incorrect password' });
      }

      // Cascade deletes handle sessions, posts, follows, likes, comments,
      // notifications, conversation members, messages, message reads
      await db.delete(users).where(eq(users.id, ctx.userId));

      ctx.res.clearCookie('session_id', { path: '/' });
      return { success: true };
    }),

  changeUsername: protectedProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(3)
          .max(30)
          .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers and underscores'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [user] = await db.select().from(users).where(eq(users.id, ctx.userId)).limit(1);

      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      // Enforce 14-day cooldown
      if (user.usernameChangedAt) {
        const daysSinceLast =
          (Date.now() - user.usernameChangedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLast < 14) {
          const daysLeft = Math.ceil(14 - daysSinceLast);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `You can change your username again in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
          });
        }
      }

      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Username already taken' });
      }

      const [updated] = await db
        .update(users)
        .set({ username: input.username, usernameChangedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, ctx.userId))
        .returning();

      return toSafeUser(updated);
    }),
});
