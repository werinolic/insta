# ADR-003: WebSocket for DMs, SSE for notifications (via tRPC subscriptions)

**Date:** 2026-02-24
**Status:** Accepted

## Context
The app needs two types of real-time updates:
1. Direct messages — bidirectional, low latency
2. Notifications (likes, comments, follows) — server → client only

Options considered: WebSocket only, SSE only, SSE + WS, polling.

## Decision
Use two transports via tRPC subscriptions, both hosted on the same Fastify server:

- **DMs → WebSocket** — bidirectional transport suits the send/receive nature of
  chat. tRPC subscription procedures handle message delivery; presence and typing
  indicators can be added later.
- **Notifications → SSE** — unidirectional (server pushes events to client).
  Simpler than WebSocket; no keep-alive ping complexity. Browser-native.

Both are implemented as tRPC `subscription` procedures, keeping the client API
uniform regardless of underlying transport.

## Consequences
+ Right transport for each use case (no overengineering)
+ Single Fastify process — no separate real-time service to deploy
+ SSE degrades gracefully (automatic reconnect built into browsers)
- Two different tRPC adapters must be configured (httpLink + wsLink + sseLink)
- WebSocket connections require connection management (reconnect on drop)
- Horizontal scaling will require sticky sessions or a pub/sub layer (Redis)
  — acceptable to defer to v2
