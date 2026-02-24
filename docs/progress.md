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

## Phase 2: Core Features ✅
- [x] File upload: MinIO + presigned URLs + sharp (sync, 150px thumb / 600px medium)
- [x] Posts: create, feed (cursor), single view, by username, delete
- [x] Follow system: follow/unfollow, followers/following lists
- [x] Likes: toggle + notification
- [x] Comments: create/delete, nested replies, @mention notifications
- [x] Notifications: list, unread count, mark all read (SSE subscription ready)
- [x] DMs: conversations (DM + group), messages, WS subscription, typing indicator
- [x] Auth: changeUsername (14-day cooldown added)

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
