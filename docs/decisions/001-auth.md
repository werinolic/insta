# ADR-001: better-auth instead of Lucia

**Date:** 2025-02-24
**Status:** Accepted

## Context
Lucia v3 is deprecated, author archived the project in 2024.

## Decision
Use better-auth — actively maintained, supports TypeScript, 
works with Drizzle ORM, has built-in session management.

## Consequences
+ Actively maintained
+ Built-in Drizzle adapter
+ Handles sessions, tokens out of the box
- Slightly more opinionated than Lucia
