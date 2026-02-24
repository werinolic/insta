import '@fastify/cookie';
import { initTRPC, TRPCError } from '@trpc/server';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from './lib/auth';

export type Context = {
  req: FastifyRequest;
  res: FastifyReply;
  userId: string | null;
  sessionId: string | null;
};

export async function createContext({
  req,
  res,
}: {
  req: FastifyRequest;
  res: FastifyReply;
}): Promise<Context> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const userId = token ? await verifyAccessToken(token) : null;
  const sessionId = (req.cookies['session_id'] as string | undefined) ?? null;

  return { req, res, userId, sessionId };
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
