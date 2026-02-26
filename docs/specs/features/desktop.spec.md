# Feature: Desktop Application (Tauri v2)
**Status:** Planned
**Last updated:** 2026-02-26

## Overview

A cross-platform desktop application for macOS, Windows, and Linux built with
Tauri v2 and a React + Vite renderer. The desktop app delivers full feature
parity with the web client and adds native OS integrations unavailable in a
browser tab.

App location in monorepo: `apps/desktop/`

---

## User Stories

### Auth
- [ ] As a user, I can register a new account
- [ ] As a user, I can log in and my session persists across cold app restarts
- [ ] As a user, I can log out (token cleared from OS secure store)
- [ ] As a user, I am automatically redirected to login when my session expires

### Feed & Posts
- [ ] As a user, I can see my chronological feed with infinite scroll
- [ ] As a user, I can create a new post by selecting files via the **native file dialog**
- [ ] As a user, I can reorder selected photos before posting
- [ ] As a user, I can view a post detail with comments
- [ ] As a user, I can browse the Explore grid
- [ ] As a user, I can like/unlike a post (optimistic update)
- [ ] As a user, I can see the real-time like count on post detail (WS subscription)
- [ ] As a user, I can add and delete comments
- [ ] As a user, I can delete my own posts
- [ ] As a user, I can archive / unarchive a post and view my archive

### Profiles
- [ ] As a user, I can view any public profile (post grid, follower/following counts)
- [ ] As a user, I can follow and unfollow other users
- [ ] As a user, I can view a user's followers and following lists
- [ ] As a user, I can search for users

### Messages
- [ ] As a user, I can view my conversation list with unread counts
- [ ] As a user, I can open a chat and receive messages in real time (WS subscription)
- [ ] As a user, I can send text messages
- [ ] As a user, I can send photos via the **native file dialog**
- [ ] As a user, I can forward a post into a conversation
- [ ] As a user, I can see typing indicators and read receipts
- [ ] As a user, I can create a new DM or group chat
- [ ] As a user (admin), I can add/remove members in a group chat

### Notifications
- [ ] As a user, I can see my notification list (likes, comments, follows, DMs)
- [ ] As a user, I receive a **native OS notification** for new DMs and activity while the app is in the background or minimized
- [ ] As a user, I see an **unread badge** on the system tray icon when there are unread notifications
- [ ] As a user, I can mark all notifications as read

### Settings
- [ ] As a user, I can edit my display name, bio, and avatar
- [ ] As a user, I can change my username (14-day cooldown enforced)
- [ ] As a user, I can change my password
- [ ] As a user, I can delete my account (password confirmation required)

### Desktop-native
- [ ] As a user, the app window remembers its size and position between launches
- [ ] As a user, I can minimize the app to the system tray and keep it running
- [ ] As a user, I can open external profile/post links in my default browser
- [ ] As a user, the app auto-updates silently in the background and prompts me to restart

---

## Acceptance Criteria

### Auth
- Session token stored via `@tauri-apps/plugin-store` (encrypted on disk)
- On launch: read `sessionId` → call `auth.refreshMobile` → store fresh `accessToken`
- On 401: clear store, redirect to `/login`

### File uploads
- Native file dialog (`@tauri-apps/plugin-dialog`) replaces `<input type="file">`
- Selected file read via Tauri FS API, converted to `Blob`, uploaded to existing
  `POST /upload` endpoint — same flow as web/mobile
- Accepted types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`; max 30 MB

### Real-time
- Same `wsLink` + `splitLink` tRPC setup as web
- `messages.subscribe` for live DM delivery
- `notifications.subscribe` (SSE) feeds both in-app list and OS notification dispatch

### Native OS notifications
- Dispatched via `@tauri-apps/plugin-notification` when app is **not** focused
- Notification types: new DM, new like, new comment, new follower
- Clicking a notification focuses the app and navigates to the relevant screen

### System tray
- Tray icon always present while app is running
- Badge count = total unread notifications + unread DM messages
- Tray menu: **Open**, **Notifications**, **Messages**, **Quit**

### Auto-updater
- Update check on launch and every 4 hours via `@tauri-apps/plugin-updater`
- Silent download; toast notification when update is ready to install
- Update server: GitHub Releases (JSON manifest)

### Window state
- Size, position, and maximized state persisted via `@tauri-apps/plugin-window-state`
- Restored exactly on next launch

---

## Technical Notes

### App structure (`apps/desktop/`)

```
apps/desktop/
├── src-tauri/               # Rust core
│   ├── src/
│   │   ├── main.rs          # Tauri builder, plugin registration
│   │   └── lib.rs           # Commands (if any custom Rust commands needed)
│   ├── tauri.conf.json      # App metadata, window config, capability allowlist
│   ├── capabilities/
│   │   └── default.json     # Tauri v2 capability file
│   └── Cargo.toml
├── src/                     # React + Vite renderer
│   ├── main.tsx             # ReactDOM.createRoot entry
│   ├── App.tsx              # Router (TanStack Router or React Router)
│   ├── lib/
│   │   ├── trpc.ts          # tRPC client (httpBatchLink + wsLink, same as web)
│   │   ├── store.ts         # Zustand store (auth slice + sessionId)
│   │   └── secure-store.ts  # Wrapper around @tauri-apps/plugin-store
│   ├── components/          # Desktop-specific components
│   │   ├── TrayManager.tsx  # Unread count → tray badge sync
│   │   ├── NotifDispatcher.tsx  # SSE → native OS notification
│   │   ├── FilePickerButton.tsx # Wraps plugin-dialog open()
│   │   └── UpdatePrompt.tsx # "Restart to update" toast
│   ├── pages/               # Route-level components (mirrors web pages)
│   │   ├── Feed.tsx
│   │   ├── Explore.tsx
│   │   ├── PostDetail.tsx
│   │   ├── Profile.tsx
│   │   ├── Messages.tsx
│   │   ├── Notifications.tsx
│   │   ├── Search.tsx
│   │   ├── Settings.tsx
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   └── styles/
│       └── globals.css
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Shared packages used
- `packages/ui` — Tamagui primitives (Button, Avatar, Input, etc.)
- `packages/shared` — Zod schemas and TypeScript types

### tRPC client

Identical split-link setup to web:
```ts
splitLink({
  condition: (op) => op.type === 'subscription',
  true: wsLink({ client: wsClient }),
  false: httpBatchLink({ url: API_URL, headers: () => ({ Authorization: `Bearer ${getToken()}` }) }),
})
```

`getToken()` reads from `@tauri-apps/plugin-store` synchronously (cached in memory after
first read; refreshed after `auth.refreshMobile`).

### Build & distribution

| Target   | Output               | Command                        |
|----------|----------------------|--------------------------------|
| macOS    | `.dmg` + `.app`      | `pnpm tauri build`             |
| Windows  | `.msi` + `.exe`      | `pnpm tauri build` (cross or CI) |
| Linux    | `.deb` + `.AppImage` | `pnpm tauri build` (cross or CI) |

CI matrix: GitHub Actions with `tauri-action` on `ubuntu-latest`, `windows-latest`,
`macos-latest`.

---

## Out of Scope (v1)

- Offline mode / local cache beyond in-memory TanStack Query cache
- Push notifications via OS push service (APNs/WNS) — current impl uses SSE polling
- Deep-link URL scheme (`insta://`) handling
- Multi-account switching
- Voice/video calls
- Touch-screen / tablet optimisation (handled by mobile app)
