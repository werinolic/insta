# ADR-001: Manual auth (bcryptjs + jose) instead of Lucia or better-auth

**Date:** 2026-02-24
**Status:** Accepted

## Context
Lucia v3 was the original choice but the author archived the project in 2024.
better-auth was added as a replacement, but its Drizzle adapter expects specific
column names (token, emailVerified, ipAddress, userAgent on sessions; name and
image on users) that conflict with our existing schema. Modifying the schema to
match better-auth would have required touching `packages/db/schema.ts` without
explicit instruction.

## Decision
Implement auth manually:
- **Password hashing:** bcryptjs, 12 rounds
- **Access tokens:** JWT via jose (HS256, 15 min expiry)
- **Sessions:** stored in our `sessions` table (id, userId, expiresAt)
- **Refresh:** session ID in httpOnly cookie (30 day expiry)

## Consequences
+ Full control over schema — no library-imposed column requirements
+ No extra tables or migrations needed
+ Simple to audit and reason about
- More boilerplate than an auth library
- Password reset, OAuth etc. must be built from scratch if needed later
