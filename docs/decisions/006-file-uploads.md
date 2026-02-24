# ADR-006: Presigned URL uploads to MinIO with synchronous image processing

**Date:** 2026-02-24
**Status:** Accepted

## Context
Posts contain images (and potentially videos). The API must handle file storage
and generate thumbnails/resized variants.

## Decision

### Upload flow
1. Client calls `upload.getPresignedUrl` tRPC procedure with `{ filename, contentType, size }`
2. API validates the request (type: JPEG/PNG/HEIC, size ≤ 30MB) and generates a
   short-lived MinIO presigned PUT URL (15 min expiry)
3. Client uploads the file **directly to MinIO** — the API server never handles binary data
4. Client calls `posts.create` with the MinIO object key; API confirms the object
   exists in MinIO before writing to DB

### Image processing (synchronous)
On `posts.create`, the API uses **sharp** to:
- Generate a thumbnail variant (150×150, cropped)
- Generate a medium variant (600px wide, aspect-preserved)
- Write both back to MinIO under derived keys (`{key}_thumb`, `{key}_medium`)
- Store all three URLs in `post_media` (url, thumbnailUrl, mediumUrl)

Processing happens in-process on the API server before the procedure returns.
For v1 this is acceptable; async processing (BullMQ + Redis) is a future option.

### Storage layout in MinIO
```
bucket: instagram-media
  posts/{postId}/{uuid}.jpg          ← original
  posts/{postId}/{uuid}_medium.jpg   ← 750px wide
  posts/{postId}/{uuid}_thumb.jpg    ← 150x150
  avatars/{userId}/{uuid}.jpg        ← profile photos (150x150 only)
```

## Consequences
+ API server never becomes a binary upload bottleneck
+ Presigned URLs are short-lived — reduces risk of unauthorized uploads
+ sharp is fast enough for sync processing at v1 scale
- sharp must be added as a dependency (native bindings — needs to be built for the target platform)
- Post creation has latency proportional to image size and variant count
- If the client uploads but never calls `posts.create`, orphaned objects accumulate in MinIO (can be cleaned by a periodic lifecycle rule)
