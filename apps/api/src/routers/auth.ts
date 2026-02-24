import '@fastify/cookie';
import { TRPCError } from '@trpc/server';
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

    return { accessToken, user: toSafeUser(user) };
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

    return { accessToken, user: toSafeUser(user) };
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
});
