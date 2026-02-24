import { Client } from 'minio';

export const minio = new Client({
  endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
  port: Number(process.env.MINIO_PORT ?? 9000),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
});

export const BUCKET = process.env.MINIO_BUCKET ?? 'instagram-media';

export async function ensureBucket() {
  const exists = await minio.bucketExists(BUCKET);
  if (!exists) {
    await minio.makeBucket(BUCKET);
  }
}

export function objectUrl(key: string): string {
  const proto = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  const host = process.env.MINIO_ENDPOINT ?? 'localhost';
  const port = process.env.MINIO_PORT ?? '9000';
  return `${proto}://${host}:${port}/${BUCKET}/${key}`;
}

export async function presignedPutUrl(key: string, expirySeconds = 900): Promise<string> {
  return minio.presignedPutObject(BUCKET, key, expirySeconds);
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await minio.statObject(BUCKET, key);
    return true;
  } catch {
    return false;
  }
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const stream = await minio.getObject(BUCKET, key);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function putObject(key: string, buffer: Buffer, contentType: string): Promise<void> {
  await minio.putObject(BUCKET, key, buffer, buffer.length, { 'Content-Type': contentType });
}
