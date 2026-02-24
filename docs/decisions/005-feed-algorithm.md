# ADR-005: Chronological feed for v1, router designed to be swappable

**Date:** 2026-02-24
**Status:** Accepted

## Context
Feed algorithms range from simple chronological queries to complex ML-ranked
fan-out systems. Options considered:

- **Option A:** Direct query — posts from followed users, ordered by created_at DESC
- **Option B:** Fan-out on write — pre-compute feed rows per follower on post creation
- **Option C:** Hybrid — fan-out for normal users, pull for high-follower accounts

## Decision
Use **Option A (direct query)** for v1:

```sql
SELECT posts.* FROM posts
JOIN follows ON posts.user_id = follows.following_id
WHERE follows.follower_id = :userId
ORDER BY posts.created_at DESC
-- keyset pagination: AND posts.created_at < :cursor
LIMIT 20
```

Supported by a composite index on `posts(user_id, created_at DESC)`.

The feed query lives entirely in a dedicated `feed` tRPC router procedure.
The interface (cursor in, paginated posts out) will not change when the
implementation is swapped to fan-out later.

## When to revisit
Switch to Option B (fan-out + Redis) when:
- Feed query p95 latency exceeds 200ms for active users, OR
- Users commonly follow > 2,000 accounts

## Consequences
+ Zero extra infrastructure for v1
+ Simple to reason about and test
+ Router interface is stable — implementation is an internal detail
- Query cost scales linearly with follow count
- No ranking or personalization (acceptable for v1)
