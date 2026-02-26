# ADR-009: Desktop framework — Tauri v2

**Date:** 2026-02-26
**Status:** Accepted

## Context

The project has a working web client (Next.js 15) and a mobile client (Expo + Tamagui).
The next platform is a cross-platform desktop application targeting macOS, Windows, and Linux.

The renderer layer must reuse existing React components, the tRPC client, TanStack Query,
Zustand, and Tamagui primitives already present in `packages/ui` and `packages/shared`.
The main question is which native shell wraps the web renderer.

### Options evaluated

| Criterion              | Tauri v2                        | Electron                         |
|------------------------|---------------------------------|----------------------------------|
| Installer size         | ~10–20 MB                       | ~150–200 MB                      |
| Memory footprint       | ~50–80 MB                       | ~200–400 MB                      |
| Renderer               | OS webview (WebKit/WebView2/Blink) | Bundled Chromium                |
| Native shell language  | Rust                            | Node.js                          |
| Security model         | Capability-based, allowlist     | Full Node.js in renderer by default |
| Auto-updater           | Built-in plugin                 | `electron-updater` (3rd party)   |
| System tray            | Built-in plugin                 | Built-in                         |
| Native notifications   | Built-in plugin                 | Built-in                         |
| Ecosystem maturity     | v2 stable (Oct 2024)            | Very mature (2013+)              |
| Monorepo fit           | Vite renderer — drop-in          | Webpack/Vite renderer — drop-in |

## Decision

Use **Tauri v2** as the native desktop shell.

The renderer is a standard **React + Vite** SPA that imports the same packages as the web
client:
- `packages/ui` — Tamagui primitives
- `packages/shared` — Zod schemas and types
- `@trpc/client` with `httpBatchLink` + `wsLink` (identical to web)
- TanStack Query + Zustand

The Rust core handles only capabilities that the webview cannot do alone:

| Capability              | Tauri plugin / API                    |
|-------------------------|---------------------------------------|
| Session token storage   | `@tauri-apps/plugin-store` (encrypted OS keychain wrapper) |
| Native OS notifications | `@tauri-apps/plugin-notification`     |
| System tray + badge     | `@tauri-apps/plugin-tray`             |
| Native file picker      | `@tauri-apps/plugin-dialog`           |
| Auto-updater            | `@tauri-apps/plugin-updater`          |
| Window state persistence| `@tauri-apps/plugin-window-state`     |
| Shell open (links)      | `@tauri-apps/plugin-shell`            |

## Authentication

Desktop faces the same httpOnly-cookie problem as mobile: the OS webview does not
automatically persist cookies the same way a browser profile does across cold launches.

Decision: reuse the **mobile session model** (ADR-007):
1. On login/register, read `sessionId` from the JSON response body.
2. Persist `accessToken` and `sessionId` via `@tauri-apps/plugin-store` (AES-256-GCM
   encrypted file in the OS data directory — Keychain on macOS, DPAPI on Windows,
   libsecret on Linux).
3. On app launch, read `sessionId` from the store and call `auth.refreshMobile` to
   obtain a fresh access token.
4. Inject `Authorization: Bearer <accessToken>` header in the tRPC client `headers()`
   function, same as mobile.

No new API procedures are needed; the existing `auth.refreshMobile` procedure is reused.

## Consequences

+ Tiny installer (~15 MB) — important for desktop distribution
+ Full feature reuse from web/mobile: tRPC, TanStack Query, Zustand, Tamagui
+ No Chromium shipped — renders in the OS's up-to-date webview
+ Capability allowlist in `tauri.conf.json` limits blast radius of XSS
+ One Rust dependency to maintain; team does not need deep Rust knowledge for the renderer
- WebKit on macOS and WebView2 on Windows have minor CSS/JS differences (test on all three)
- `@tauri-apps/plugin-store` is not the OS Keychain directly; it is an encrypted JSON file
  (acceptable for access tokens; production v2 may migrate to the native Keychain plugin)
- Auto-updater requires a hosted update server (GitHub Releases is sufficient for v1)
