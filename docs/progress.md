# Implementation Progress

## Phase 0: Environment ✅
- [x] Node, pnpm, Bun, Docker, Claude Code
- [x] VS Code extensions + settings
- [x] MCP servers config
- [x] Copilot instructions + prompt files
- [x] CLAUDE.md

## Phase 1: Foundation ✅
- [x] Monorepo setup (Turborepo + pnpm)
- [x] packages/db: Drizzle schema + pg client
- [x] packages/shared: Zod schemas + types
- [x] apps/api: Bun + Fastify + tRPC setup
- [x] Auth: register, login, logout, me, updateProfile, changePassword (bcryptjs + jose JWT)

## Phase 2: Core Features
- [ ] File upload: MinIO + presigned URLs
- [ ] Posts: create, feed, single view
- [ ] Follow system

## Phase 3: Social
- [ ] Likes + Comments
- [ ] Direct messages (WebSocket)
- [ ] Group chats

## Phase 4: Polish
- [ ] Settings page
- [ ] Notifications
- [ ] Share / forward posts

## Blockers
- none

## Decisions
- see /docs/decisions/
