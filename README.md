# Instagram Clone

A full-stack Instagram clone with a REST/tRPC API, Next.js web app, and Expo mobile app — built as a monorepo.

## Features

- **Auth** — register, login, persistent sessions (cookie on web, SecureStore on mobile), profile editing, username change (14-day cooldown), account deletion
- **Posts** — multi-photo posts (up to 10), captions, @mention tagging, infinite-scroll feed, carousel viewer, archive/unarchive
- **Explore** — public post grid for all non-archived posts
- **Search** — live user search
- **Follows** — follow/unfollow, followers and following list pages
- **Likes** — optimistic toggle, live like count on post detail (WebSocket), who-liked list
- **Comments** — nested replies (1 level), @mention highlighting, delete
- **Notifications** — 5 types (like, comment, follow, mention, message), real-time badge via WebSocket, deduplication
- **Direct Messages** — 1:1 and group chats, real-time delivery (WebSocket), photo messages, post sharing, typing indicator, read receipts ("Seen ✓✓")
- **Group Chats** — create with multiple members, optional name, admin add/remove members
- **Settings** — edit profile, avatar upload, change password, change username, archived posts, delete account

---

## Monorepo Structure

```
.
├── apps/
│   ├── api/          # Bun + Fastify + tRPC — port 3001
│   ├── web/          # Next.js 15 App Router — port 3000
│   └── mobile/       # Expo (iOS + Android)
├── packages/
│   ├── db/           # Drizzle ORM schema + PostgreSQL client
│   ├── shared/       # Zod schemas and shared types
│   └── ui/           # Tamagui shared primitives (mobile)
├── docs/
│   ├── decisions/    # Architecture Decision Records (ADR-001 – ADR-008)
│   ├── specs/        # Feature specifications
│   └── progress.md   # Implementation progress log
└── docker-compose.yml
```

---

## Tech Stack

| | Technology |
|---|---|
| Runtime | Bun |
| API framework | Fastify 5 |
| API layer | tRPC v11 |
| Database | PostgreSQL 16 + Drizzle ORM |
| File storage | MinIO (S3-compatible) + sharp |
| Web | Next.js 15, React 19, Tailwind CSS |
| Web state | TanStack Query v5 + Zustand |
| Mobile | Expo SDK 52 + Expo Router v6 |
| Mobile UI | Tamagui |
| Real-time | WebSocket (tRPC subscriptions via `@fastify/websocket`) |
| Auth | bcryptjs + jose (JWT HS256) |
| Monorepo | Turborepo + pnpm |

---

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.1
- [Node.js](https://nodejs.org) ≥ 20 (for Next.js)
- [pnpm](https://pnpm.io) ≥ 10
- [Docker](https://www.docker.com) (for PostgreSQL + MinIO)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (for mobile)

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd repo
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432` (user: `postgres`, password: `postgres`, db: `instagram_dev`)
- **MinIO** on `localhost:9000` (console at `localhost:9001`, user: `minioadmin`, password: `minioadmin`)

### 3. Configure environment

**API** — create `apps/api/.env`:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/instagram_dev
JWT_SECRET=change-me-in-production-min-32-chars!!
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=instagram-media
CORS_ORIGIN=http://localhost:3000
PORT=3001
```

**Web** — create `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Mobile** — the `eas.json` `development` profile sets `EXPO_PUBLIC_API_URL=http://localhost:3001` automatically. For local Expo Go testing without EAS, create `apps/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://<your-local-ip>:3001
```

### 4. Run database migrations

```bash
cd packages/db
pnpm drizzle-kit migrate
```

### 5. Start development servers

From the repo root:

```bash
pnpm dev
```

This runs all apps in parallel via Turborepo:
- API → `http://localhost:3001`
- Web → `http://localhost:3000`
- Mobile → Expo dev server (scan QR with Expo Go or run on simulator)

Or start apps individually:

```bash
# API only
cd apps/api && bun run dev

# Web only
cd apps/web && pnpm dev

# Mobile only
cd apps/mobile && pnpm dev
```

---

## API

The tRPC router is exposed at `http://localhost:3001/trpc` and a REST upload endpoint at `POST http://localhost:3001/upload`.

### Authentication

- Web: access token in `Authorization: Bearer` header; refresh token in `httpOnly` cookie
- Mobile: `sessionId` returned in login/register JSON body; stored in `expo-secure-store`; refreshed via `auth.refreshMobile`
- WebSocket: JWT passed as `?token=<jwt>` query param on connection

### WebSocket subscriptions

| Procedure | Description |
|---|---|
| `messages.subscribe` | Live message and typing-indicator delivery |
| `notifications.subscribe` | Real-time notification payload + unread count |
| `likes.subscribeCount` | Live like count per post (used on post detail page) |

### Upload endpoint

```
POST /upload?purpose=post&filename=<name>
Authorization: Bearer <token>
Content-Type: <image/jpeg|image/png|image/heic|image/webp>
Body: <binary file data>
```

Returns:
```json
{
  "key": "posts/.../uuid.jpg",
  "url": "http://...",
  "thumbnailUrl": "http://...",
  "mediumUrl": "http://...",
  "width": 1920,
  "height": 1080
}
```

---

## Web Routes

| Route | Description |
|---|---|
| `/` | Feed (infinite scroll) |
| `/login`, `/register` | Auth pages |
| `/explore` | Public post grid |
| `/search` | User search |
| `/notifications` | Notification list |
| `/messages` | Conversation list + chat |
| `/settings` | Profile, password, username, archived posts, delete account |
| `/[username]` | Public profile + post grid |
| `/[username]/followers` | Followers list |
| `/[username]/following` | Following list |
| `/p/[postId]` | Post detail + comments |

---

## Mobile Screens

| Route | Description |
|---|---|
| `/(tabs)` | Feed tab (infinite scroll) |
| `/(tabs)/new` | Create post (multi-photo, reorder, caption) |
| `/(tabs)/search` | User search |
| `/(tabs)/notifications` | Notification list + live badge |
| `/(tabs)/profile` | Own profile + post grid |
| `/[username]` | Public profile |
| `/[username]/followers` | Followers list |
| `/[username]/following` | Following list |
| `/p/[postId]` | Post detail + comments |
| `/likes/[postId]` | Who liked a post |
| `/messages` | Conversation list |
| `/messages/[conversationId]` | Chat + live messages |
| `/settings` | Settings menu |
| `/settings/profile` | Edit profile + avatar |
| `/settings/username` | Change username |
| `/settings/password` | Change password |
| `/settings/archived` | Archived posts grid |
| `/settings/delete-account` | Account deletion |

---

## Mobile Builds (EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Development build (internal dev client)
eas build --profile development --platform ios

# Preview build (internal distribution)
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all

# Submit to stores
eas submit --profile production --platform all
```

Update `apps/mobile/eas.json` with your Apple ID, App Store Connect App ID, Apple Team ID, and Android service account key path before submitting.

---

## Useful Commands

```bash
# Type-check all packages
pnpm typecheck

# Generate a new DB migration
cd packages/db && pnpm drizzle-kit generate

# Apply migrations
cd packages/db && pnpm drizzle-kit migrate

# Open Drizzle Studio (DB browser)
cd packages/db && pnpm drizzle-kit studio

# Open MinIO console
open http://localhost:9001
# Login: minioadmin / minioadmin
```

---

## Architecture Decisions

See `docs/decisions/` for the full set of ADRs:

| ADR | Decision |
|---|---|
| 001 | JWT + httpOnly refresh cookie for web auth; sessionId for mobile |
| 002 | tRPC for type-safe API; Fastify as HTTP/WS server |
| 003 | WebSocket for all tRPC subscriptions (DMs, notifications, like count) |
| 004 | Zustand for client state; TanStack Query for server state |
| 005 | Chronological feed (no algorithm); cursor-based pagination |
| 006 | API-proxied upload via `POST /upload`; sharp for sync image processing |
| 007 | Mobile auth via sessionId (no cookies); `auth.refreshMobile` procedure |
| 008 | Fastify WebSocket adapter registered for mobile WS subscriptions |
