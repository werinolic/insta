# ADR-003: WebSocket for all real-time subscriptions

**Date:** 2026-02-24
**Updated:** 2026-02-25
**Status:** Accepted (revised — see note below)

## Context
The app needs two types of real-time updates:
1. Direct messages — bidirectional, low latency
2. Notifications (likes, comments, follows) — server → client only

Options considered: WebSocket only, SSE only, SSE + WS, polling.

## Original Decision (2026-02-24)
Use two transports via tRPC subscriptions, both hosted on the same Fastify server:
- **DMs → WebSocket** — bidirectional transport suits the send/receive nature of chat.
- **Notifications → SSE** — unidirectional (server pushes events to client). Simpler than WebSocket.

## Revised Decision (2026-02-25)
**WebSocket is used for all tRPC subscriptions** — both DMs and notifications.

During implementation, the web client was configured with a single `splitLink` (httpBatchLink + wsLink). Routing all subscriptions through `wsLink` simplifies the client setup: one connection handles messages, notifications, and like-count updates uniformly, without needing a separate SSE adapter.

The mobile client (`expo`) uses the same `splitLink` pattern for the same reasons.

Subscription procedures implemented:
- `messages.subscribe` — live message and typing-indicator delivery
- `notifications.subscribe` — real-time notification badge + payload
- `likes.subscribeCount` — live like count on post detail page

## Consequences
+ Single WebSocket connection per client covers all real-time features
+ Uniform tRPC client configuration on web and mobile
+ No need for a separate SSE event-source adapter
- WebSocket requires a persistent connection; SSE would have been simpler for the notification-only use case
- Horizontal scaling requires sticky sessions or a Redis pub/sub layer — acceptable to defer to v2
