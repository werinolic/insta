import { z } from 'zod';
import sharp from 'sharp';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { presignedPutUrl, objectExists, getObjectBuffer, putObject, objectUrl, BUCKET } from '../lib/minio';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
const MAX_SIZE_BYTES = 30 * 1024 * 1024; // 30MB

export const uploadRouter = router({
  getPresignedUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1).max(255),
        contentType: z.string(),
        size: z.number().int().positive(),
        purpose: z.enum(['post', 'avatar', 'message']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ALLOWED_TYPES.includes(input.contentType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Unsupported file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
        });
      }

      if (input.size > MAX_SIZE_BYTES) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File exceeds 30MB limit',
        });
      }

      const ext = input.filename.split('.').pop() ?? 'jpg';
      const key = `${input.purpose}s/${ctx.userId}/${crypto.randomUUID()}.${ext}`;
      const url = await presignedPutUrl(key, 900);

      return { key, url, bucket: BUCKET };
    }),

  processImage: protectedProcedure
    .input(
      z.object({
        key: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const exists = await objectExists(input.key);
      if (!exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Object not found in storage' });
      }

      const buffer = await getObjectBuffer(input.key);
      const meta = await sharp(buffer).metadata();

      const thumbKey = input.key.replace(/(\.[^.]+)$/, '_thumb$1');
      const mediumKey = input.key.replace(/(\.[^.]+)$/, '_medium$1');

      const thumbBuffer = await sharp(buffer)
        .resize(150, 150, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toBuffer();

      const mediumBuffer = await sharp(buffer)
        .resize(600, undefined, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      await Promise.all([
        putObject(thumbKey, thumbBuffer, 'image/jpeg'),
        putObject(mediumKey, mediumBuffer, 'image/jpeg'),
      ]);

      return {
        url: objectUrl(input.key),
        thumbnailUrl: objectUrl(thumbKey),
        mediumUrl: objectUrl(mediumKey),
        width: meta.width ?? null,
        height: meta.height ?? null,
      };
    }),
});
