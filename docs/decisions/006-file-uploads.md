# ADR-006: API-proxied uploads to MinIO with synchronous image processing

**Date:** 2026-02-24
**Updated:** 2026-02-25
**Status:** Accepted (revised — see note below)

## Context
Posts contain images. The API must handle file storage and generate thumbnails/resized variants.

## Original Decision (2026-02-24)
Use MinIO presigned PUT URLs: the client uploads directly to MinIO, bypassing the API server for binary data.

## Revised Decision (2026-02-25)
**Use a `POST /upload` REST endpoint on the API server** — the client sends binary file data to the API, which processes and stores it.

### Upload flow
1. Client sends file as the request body to `POST /upload?purpose=post&filename=<name>` with `Authorization: Bearer <jwt>`
2. API validates file type (JPEG/PNG/HEIC/WebP) and size (≤ 30MB)
3. API passes binary data through **sharp** to generate thumbnail and medium variants in memory
4. API uploads all three variants to MinIO
5. API returns `{ key, url, thumbnailUrl, mediumUrl, width, height }` as JSON
6. Client calls `posts.create` (or `messages.send`) with the returned URLs

### Image processing (synchronous)
- Thumbnail: 150×150, cover crop
- Medium: 600px wide, aspect-preserved
- All three variants written to MinIO under derived keys (`{key}_thumb`, `{key}_medium`)

### Storage layout in MinIO
```
bucket: instagram-media
  posts/{postId}/{uuid}.jpg          ← original
  posts/{postId}/{uuid}_medium.jpg   ← 600px wide
  posts/{postId}/{uuid}_thumb.jpg    ← 150×150 crop
  avatars/{userId}/{uuid}.jpg        ← profile photos (150×150 only)
```

### Why API-proxied instead of presigned URLs
- Avoids CORS configuration between browser/mobile and MinIO
- Centralises auth and size/type validation in one place
- Simpler mobile upload (React Native `fetch` or expo `uploadAsync` → API; no two-step flow)
- Sharp processing happens on the API server before the procedure returns

## Consequences
+ Simpler client code — one request, one response with all URLs
+ No CORS issues between clients and MinIO
+ Sharp validation and processing in a single step
- API server handles binary data (potential throughput bottleneck at scale; acceptable for v1)
- Image processing adds latency to the upload request proportional to image size and variant count
