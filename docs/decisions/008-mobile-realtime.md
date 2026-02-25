# ADR-008: Mobile uses WebSocket for all tRPC subscriptions (not SSE)

**Date:** 2026-02-25
**Status:** Accepted

## Context

The web client uses two tRPC subscription transports:
- **WebSocket** for DM messages (`messages.subscribe`, `likes.subscribeCount`)
- **SSE** for notifications (`notifications.subscribe`)

React Native does not have a native `EventSource` API (SSE). Polyfills exist
but add complexity and have reliability issues on some Android versions.

## Decision

Mobile uses **WebSocket for all tRPC subscriptions** — DMs and notifications
both go through `wsLink`. The server already supports WS subscriptions for
all three procedures.

Client setup:

```ts
splitLink({
  condition: (op) => op.type === 'subscription',
  true: wsLink({ client: wsClient }),
  false: httpBatchLink({ ... }),
})
```

This means the API must have the Fastify WebSocket adapter registered
(see Required API Changes in `docs/mobile/README.md`).

## Consequences

+ Single transport for all subscriptions — simpler mobile client
+ No SSE polyfill dependency
+ The server-side subscription logic is transport-agnostic (tRPC handles it)
- WebSocket connections require reconnect logic on network change
  (Expo's `NetInfo` can trigger reconnect)
- Slightly higher overhead than SSE for unidirectional notification events
  (acceptable — same WS connection is reused for DMs anyway)
