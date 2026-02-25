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

## Phase 3: Web Client ✅
- [x] Next.js 15 App Router setup (Tailwind, tRPC, TanStack Query, Zustand)
- [x] Auth pages: login, register
- [x] Session bootstrap: auth.refresh on mount restores session from cookie
- [x] Feed page with infinite scroll
- [x] Post detail page with comments
- [x] Profile page with post grid
- [x] Messages page (conversation list + chat window)
- [x] Notifications page (mark all read on visit)
- [x] Settings page (profile, username, password)
- [x] Optimistic like toggle
- [x] AuthGuard component

## Phase 4: Mobile (Expo)

> Full guide: `docs/mobile/README.md`
> ADRs: `docs/decisions/007-mobile-auth.md`, `docs/decisions/008-mobile-realtime.md`

### Pre-work — API changes needed first
- [x] `auth.login` + `auth.register`: return `sessionId` in JSON body (ADR-007)
- [x] Add `auth.refreshMobile` procedure (takes `sessionId` as input, not cookie)
- [x] Register Fastify WebSocket adapter on API for WS subscriptions (ADR-008)

### Setup
- [x] Install Expo + Expo Router in `apps/mobile/`
- [x] Install Tamagui and populate `packages/ui/` with shared primitives
- [x] tRPC client with `splitLink` (httpBatchLink + wsLink)
- [x] Zustand store with `expo-secure-store` persistence
- [x] Auth bootstrap in root `_layout.tsx` (reads sessionId from SecureStore)

### Screens
- [x] Login screen (`/(auth)/login`)
- [x] Register screen (`/(auth)/register`)
- [x] Feed tab — `FlatList` infinite scroll, PostCard component
- [x] Create post tab — `expo-image-picker`, upload via `POST /upload`
- [x] Search tab — user search
- [x] Notifications tab — list, mark all read, badge count
- [x] Profile tab — own profile (PostGrid, follow counts)
- [x] Public profile screen (`/[username]`)
- [x] Post detail screen (`/p/[postId]`) — comments, like button
- [x] Messages screen — conversation list
- [x] Chat screen (`/messages/[conversationId]`) — WS subscription for live messages
- [x] Settings screens — edit profile, change password, change username

### Components
- [x] `PostCard` — inline like/comment, owner delete menu
- [x] `PostGrid` — 3-column grid inline in profile screens
- [x] `LikeButton` — optimistic toggle (inline in PostCard)
- [x] `Providers` — tRPC + TanStack Query + Tamagui
- [x] Auth guard — `<Redirect>` pattern in tab `_layout.tsx`

### Real-time
- [x] WS client setup (singleton wsClient, reset on logout)
- [x] `messages.subscribe` — live DM delivery in chat screen
- [ ] `notifications.subscribe` — live notification badge (subscribe wired, badge update pending)

## Blockers
- none

## Decisions
- see `docs/decisions/` (ADR-001 through ADR-008)
