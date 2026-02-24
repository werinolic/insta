# ADR-002: tRPC for all API endpoints including real-time subscriptions

**Date:** 2026-02-24
**Status:** Accepted

## Context
The stack includes Fastify + tRPC. The question was whether to use tRPC for
all endpoints or to mix in raw Fastify routes for WebSocket and SSE concerns.

## Decision
Use tRPC for everything — business logic procedures and real-time subscriptions.
tRPC v11 supports subscriptions natively, with the transport (WebSocket or SSE)
configured at the adapter level rather than in individual routers.

Routers are organized by feature:
- `auth` — register, login, logout, me, updateProfile, changePassword
- `users` — search, profile by username
- `posts` — create, feed, single post, delete
- `follows` — follow, unfollow, followers, following
- `likes` — like, unlike
- `comments` — create, list, delete
- `conversations` — list, create, single
- `messages` — send, history (subscription)
- `notifications` — subscription (SSE)
- `upload` — presigned URL generation

Raw Fastify routes are limited to: `/health`.

## Consequences
+ Single, consistent API surface for all clients (web + mobile)
+ tRPC subscriptions handle real-time without a separate WS server
+ End-to-end type safety across all transports
- tRPC WebSocket subscriptions require the WS adapter on the client
- SSE and WS need separate tRPC adapters configured on the server
