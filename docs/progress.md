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
- [ ] `auth.login` + `auth.register`: return `sessionId` in JSON body (ADR-007)
- [ ] Add `auth.refreshMobile` procedure (takes `sessionId` as input, not cookie)
- [ ] Register Fastify WebSocket adapter on API for WS subscriptions (ADR-008)

### Setup
- [ ] Install Expo + Expo Router in `apps/mobile/`
- [ ] Install Tamagui and populate `packages/ui/` with shared primitives
- [ ] tRPC client with `splitLink` (httpBatchLink + wsLink)
- [ ] Zustand store with `expo-secure-store` persistence
- [ ] Auth bootstrap in root `_layout.tsx` (reads sessionId from SecureStore)

### Screens
- [ ] Login screen (`/(auth)/login`)
- [ ] Register screen (`/(auth)/register`)
- [ ] Feed tab — `FlatList` infinite scroll, PostCard component
- [ ] Create post tab — `expo-image-picker`, upload via `POST /upload`
- [ ] Search tab — user search
- [ ] Notifications tab — list, mark all read, badge count via WS subscription
- [ ] Profile tab — own profile (PostGrid, follow counts)
- [ ] Public profile screen (`/[username]`)
- [ ] Post detail screen (`/p/[postId]`) — carousel, comments, like button
- [ ] Messages screen — conversation list
- [ ] Chat screen (`/messages/[conversationId]`) — WS subscription for live messages
- [ ] Settings screens — edit profile, change password, change username, archived posts

### Components
- [ ] `PostCard` — same data shape as web, adapt to React Native
- [ ] `PostGrid` — `FlatList` 3-column grid
- [ ] `LikeButton` — optimistic toggle (same mutation logic as web)
- [ ] `CommentList` — nested replies
- [ ] `ProfileHeader` — avatar, bio, follow button
- [ ] `PostActionsMenu` — ActionSheet (archive/delete) for own posts
- [ ] `NotificationItem`
- [ ] `ChatBubble`
- [ ] `AuthGuard` — `<Redirect href="/login" />` pattern in Expo Router

### Real-time
- [ ] WS client setup with reconnect on `NetInfo` change
- [ ] `messages.subscribe` — live DM delivery
- [ ] `notifications.subscribe` — live notification badge

## Blockers
- none

## Decisions
- see `docs/decisions/` (ADR-001 through ADR-008)
