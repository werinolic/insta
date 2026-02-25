import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import type { FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import { appRouter } from './routers';
import type { AppRouter } from './routers';
import { createContext } from './trpc';
import { ensureBucket } from './lib/minio';

async function main() {
  await ensureBucket();
  const app = Fastify({ logger: true });

  await app.register(fastifyCookie);
  await app.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  await app.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
      onError({ path, error }) {
        if (error.code === 'INTERNAL_SERVER_ERROR') {
          console.error(`tRPC error on /${path ?? 'unknown'}:`, error);
        }
      },
    } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
  });

  app.get('/health', async () => ({ status: 'ok' }));

  const port = Number(process.env.PORT ?? 3001);
  await app.listen({ port, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
