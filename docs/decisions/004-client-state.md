# ADR-004: TanStack Query for server state, Zustand for local UI state

**Date:** 2026-02-24
**Status:** Accepted

## Context
Both web (Next.js) and mobile (Expo) clients need a consistent approach to
state management and data fetching.

## Decision

**TanStack Query (via tRPC client)** owns all server state:
- Feed, posts, comments, likes, follows, DMs
- Caching, background refetch, deduplication handled automatically
- Optimistic updates for likes, follows, and comments (update cache before
  server confirms, roll back on error)
- Cursor-based infinite queries for all paginated lists (feed, comments,
  followers/following, DM history)

**Zustand** owns ephemeral local UI state only:
- Active modal / bottom sheet
- Media picker / camera state
- Post composer draft
- Notification badge count (seeded from SSE, cleared on read)

**Pagination strategy:** cursor-based throughout. The cursor is the `id` (or
`createdAt`) of the last item in the previous page. Offset pagination is avoided
because live inserts shift items between pages.

## Consequences
+ Cursor pagination is stable under concurrent inserts
+ Optimistic updates give immediate feedback for social interactions
+ TanStack Query cache acts as an in-memory read layer — reduces redundant fetches
+ Zustand keeps local state minimal and co-located
- Optimistic rollback logic must be written per mutation
- Cursor pagination requires the DB queries to use keyset pagination patterns
