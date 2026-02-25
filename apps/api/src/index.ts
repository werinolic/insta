import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import type { FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import sharp from 'sharp';
import { appRouter } from './routers';
import type { AppRouter } from './routers';
import { createContext } from './trpc';
import { ensureBucket, putObject, objectUrl } from './lib/minio';
import { verifyAccessToken } from './lib/auth';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
const MAX_SIZE = 30 * 1024 * 1024; // 30 MB

async function main() {
  await ensureBucket();

  const app = Fastify({
    logger: true,
    bodyLimit: MAX_SIZE + 1024, // a little over 30 MB
  });

  // Allow raw binary bodies for image uploads
  for (const mime of ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/octet-stream']) {
    app.addContentTypeParser(mime, { parseAs: 'buffer' }, (_req, body, done) => done(null, body));
  }

  await app.register(fastifyCookie);
  await app.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  // ── REST upload endpoint (avoids browser→MinIO CORS complexity) ──────────
  // POST /upload?purpose=post&filename=photo.jpg
  // Body: raw file bytes, Content-Type: image/jpeg (or png/heic/webp)
  app.post<{
    Querystring: { purpose?: string; filename?: string };
  }>(
    '/upload',
    {
      config: { rawBody: true },
    },
    async (req, reply) => {
      // Auth
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return reply.code(401).send({ error: 'Unauthorized' });
      const userId = await verifyAccessToken(token).catch(() => null);
      if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

      const contentType = req.headers['content-type'] ?? '';
      const mimeType = contentType.split(';')[0].trim();

      if (!ALLOWED_TYPES.includes(mimeType)) {
        return reply.code(400).send({ error: `Unsupported type: ${mimeType}` });
      }

      const body = req.body as Buffer;
      if (!body || body.length === 0) return reply.code(400).send({ error: 'Empty body' });
      if (body.length > MAX_SIZE) return reply.code(400).send({ error: 'File exceeds 30 MB' });

      const purpose = req.query.purpose ?? 'post';
      const filename = req.query.filename ?? 'upload';
      const ext = filename.split('.').pop() ?? 'jpg';
      const key = `${purpose}s/${userId}/${crypto.randomUUID()}.${ext}`;

      // Store original
      await putObject(key, body, mimeType);

      // Process with sharp
      const meta = await sharp(body).metadata();
      const thumbKey = key.replace(/(\.[^.]+)$/, '_thumb.jpg');
      const mediumKey = key.replace(/(\.[^.]+)$/, '_medium.jpg');

      const [thumbBuf, mediumBuf] = await Promise.all([
        sharp(body).resize(150, 150, { fit: 'cover' }).jpeg({ quality: 85 }).toBuffer(),
        sharp(body)
          .resize(600, undefined, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer(),
      ]);

      await Promise.all([
        putObject(thumbKey, thumbBuf, 'image/jpeg'),
        putObject(mediumKey, mediumBuf, 'image/jpeg'),
      ]);

      return reply.send({
        key,
        url: objectUrl(key),
        thumbnailUrl: objectUrl(thumbKey),
        mediumUrl: objectUrl(mediumKey),
        width: meta.width ?? null,
        height: meta.height ?? null,
      });
    },
  );

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
