# Mobile App — Development Guide

**App:** `apps/mobile/` — Expo (React Native) Instagram clone
**Status:** Not yet started (Phase 4)
**Depends on:** Phase 1–3 complete (API + web client both done)

---

## Table of Contents

1. [Stack](#stack)
2. [Setup](#setup)
3. [Architecture — screens & navigation](#architecture)
4. [API integration](#api-integration)
5. [Authentication — key differences from web](#authentication)
6. [Real-time (WebSocket + SSE)](#real-time)
7. [Image uploads](#image-uploads)
8. [Required API changes before starting](#required-api-changes)
9. [What the web already does (reuse patterns)](#reuse-from-web)

---

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Expo SDK 52+ (bare or managed) | Use Expo Router for navigation |
| UI components | Tamagui | Already in `packages/ui/` (empty, needs populating) |
| Routing/navigation | Expo Router (file-based) | Same mental model as Next.js App Router |
| API client | `@trpc/react-query` + `@trpc/client` | Same as web — types shared via `@repo/api` |
| Server state | TanStack Query v5 | Same as web |
| Local state | Zustand | Same store patterns as web |
| Token storage | `expo-secure-store` | **Cannot use httpOnly cookies on mobile** |
| Image picker | `expo-image-picker` | For selecting photos to post |
| Camera | `expo-camera` (optional) | For taking new photos |

---

## Setup

### Prerequisites

```bash
npm install -g expo-cli eas-cli
# or: bun add -g expo-cli eas-cli
```

### Install dependencies in `apps/mobile/`

```bash
cd apps/mobile
pnpm add expo expo-router expo-secure-store expo-image-picker
pnpm add @trpc/client @trpc/react-query @tanstack/react-query zustand
pnpm add @tamagui/core @tamagui/config tamagui
pnpm add react-native-safe-area-context react-native-screens
pnpm add @react-native-async-storage/async-storage
pnpm add -D @repo/api  # type-only — same as web
```

### `app.json` / `app.config.ts`

```ts
export default {
  name: 'Insta',
  slug: 'insta',
  scheme: 'insta',           // required for Expo Router deep links
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001',
  },
};
```

### Environment

Create `apps/mobile/.env`:
```
EXPO_PUBLIC_API_URL=http://localhost:3001
```

For device testing replace `localhost` with your machine's local IP (e.g. `192.168.x.x`).

---

## Architecture

### Screens (Expo Router file layout)

```
apps/mobile/app/
├── _layout.tsx              ← Root layout (providers, auth bootstrap)
├── (auth)/
│   ├── login.tsx
│   └── register.tsx
├── (tabs)/                  ← Bottom tab navigator
│   ├── _layout.tsx          ← Tab bar definition
│   ├── index.tsx            ← Feed
│   ├── search.tsx           ← User search
│   ├── new.tsx              ← Create post (camera / gallery sheet)
│   ├── notifications.tsx    ← Notifications list
│   └── profile.tsx          ← Own profile
├── [username]/
│   └── index.tsx            ← Public profile page
├── p/
│   └── [postId].tsx         ← Single post + comments
├── messages/
│   ├── index.tsx            ← Conversation list
│   └── [conversationId].tsx ← Chat screen
└── settings/
    ├── index.tsx            ← Settings menu
    ├── profile.tsx          ← Edit profile
    ├── password.tsx         ← Change password
    ├── username.tsx         ← Change username
    └── archived.tsx         ← Archived posts
```

### Tab bar icons

| Tab | Icon | Route |
|---|---|---|
| Feed | Home | `/(tabs)/` |
| Search | Search | `/(tabs)/search` |
| New post | `+` square | `/(tabs)/new` |
| Notifications | Heart | `/(tabs)/notifications` |
| Profile | Avatar | `/(tabs)/profile` |

---

## API Integration

### tRPC client setup

Mobile uses the same `AppRouter` type from `@repo/api` as the web. The client
setup is identical except tokens come from `expo-secure-store` instead of
Zustand (which is seeded from cookies on web).

```ts
// apps/mobile/lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@repo/api';
import * as SecureStore from 'expo-secure-store';

export const trpc = createTRPCReact<AppRouter>();

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export function makeTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${API_URL}/trpc`,
        async headers() {
          const token = await SecureStore.getItemAsync('accessToken');
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
```

### Zustand stores

Reuse the same store shapes as `apps/web/src/lib/store.ts`:

```ts
// apps/mobile/lib/store.ts
import { create } from 'zustand';
import type { SafeUser } from '@repo/shared';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  accessToken: string | null;
  sessionId: string | null;    // ← mobile needs this; web uses cookie
  user: SafeUser | null;
  setAuth: (token: string, sessionId: string, user: SafeUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  sessionId: null,
  user: null,
  setAuth: (accessToken, sessionId, user) => {
    // Persist both to SecureStore
    SecureStore.setItemAsync('accessToken', accessToken);
    SecureStore.setItemAsync('sessionId', sessionId);
    set({ accessToken, sessionId, user });
  },
  clearAuth: () => {
    SecureStore.deleteItemAsync('accessToken');
    SecureStore.deleteItemAsync('sessionId');
    set({ accessToken: null, sessionId: null, user: null });
  },
}));
```

---

## Authentication

### Key difference from web

The web uses an **httpOnly session cookie** to persist the session across
browser refreshes. React Native cannot use httpOnly cookies.

**Mobile strategy:**
1. `auth.login` returns `{ accessToken, sessionId, user }` — the sessionId
   must be added to the login/register response (see [Required API Changes](#required-api-changes)).
2. Both are stored in `expo-secure-store` (encrypted native storage).
3. On app launch, read `sessionId` from SecureStore and call `auth.refreshMobile`
   (a new procedure — see below) to get a fresh access token.

### Auth bootstrap on app start

```ts
// apps/mobile/app/_layout.tsx
function AuthBootstrap({ children }) {
  const { setAuth, clearAuth } = useAuthStore();
  const refresh = trpc.auth.refreshMobile.useMutation();

  useEffect(() => {
    (async () => {
      const sessionId = await SecureStore.getItemAsync('sessionId');
      if (!sessionId) return clearAuth();

      refresh.mutate({ sessionId }, {
        onSuccess: ({ accessToken, user }) => setAuth(accessToken, sessionId, user),
        onError: () => clearAuth(),
      });
    })();
  }, []);

  return children;
}
```

### Route protection

Use Expo Router's layout guards:

```ts
// apps/mobile/app/(tabs)/_layout.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/lib/store';

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Redirect href="/login" />;
  // ... tabs config
}
```

---

## Real-time

### WebSocket for DMs

tRPC WebSocket subscriptions use `wsLink` on the client. The WS URL is
`ws://localhost:3001` (or `wss://` in production).

```ts
import { createWSClient, wsLink, splitLink, httpBatchLink } from '@trpc/client';

const wsClient = createWSClient({ url: 'ws://localhost:3001' });

export function makeTRPCClient() {
  return trpc.createClient({
    links: [
      splitLink({
        condition: (op) => op.type === 'subscription',
        true: wsLink({ client: wsClient }),
        false: httpBatchLink({ url: `${API_URL}/trpc`, headers: ... }),
      }),
    ],
  });
}
```

Usage in chat screen:

```ts
trpc.messages.subscribe.useSubscription(
  { conversationId },
  {
    onData: (msg) => {
      // Append to local message list
    },
  }
);
```

### SSE for notifications

React Native does not have a native `EventSource`. Use the
[`react-native-event-source`](https://github.com/jordanbyron/react-native-event-source)
polyfill, or connect via `wsLink` if you unify both on WebSocket transport.

**Recommended:** route all subscriptions through WebSocket (simpler on mobile
than maintaining two transports). Since the server supports both, just use
`wsLink` for everything and drop the SSE transport on mobile.

```ts
// All subscriptions → WS (notifications + DMs)
splitLink({
  condition: (op) => op.type === 'subscription',
  true: wsLink({ client: wsClient }),
  ...
})
```

---

## Image Uploads

Mobile uploads go to the same `POST /upload` REST endpoint as the web:

```ts
// apps/mobile/lib/upload.ts
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function pickAndUpload(): Promise<UploadResult | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: 10,
    quality: 1,
  });

  if (result.canceled) return null;

  const token = await SecureStore.getItemAsync('accessToken');

  const uploads = await Promise.all(
    result.assets.map(async (asset) => {
      const filename = asset.uri.split('/').pop() ?? 'photo.jpg';
      const mimeType = asset.mimeType ?? 'image/jpeg';

      // Use FileSystem.uploadAsync for streaming upload
      const response = await FileSystem.uploadAsync(
        `${API_URL}/upload?purpose=post&filename=${encodeURIComponent(filename)}`,
        asset.uri,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: {
            'Content-Type': mimeType,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      return JSON.parse(response.body) as {
        key: string; url: string;
        thumbnailUrl: string; mediumUrl: string;
        width: number | null; height: number | null;
      };
    })
  );

  return uploads;
}
```

> `FileSystem.uploadAsync` is the correct API for Expo — do not use `fetch`
> with a `file://` URI directly, it won't work on all platforms.

---

## Required API Changes

Before starting the mobile client, the following API changes are needed.
These are small and low-risk:

### 1. Return `sessionId` in login + register responses

**File:** `apps/api/src/routers/auth.ts`

Both `auth.login` and `auth.register` currently set the session ID in an
httpOnly cookie only. Mobile cannot read cookies.

Change both mutations to also return `sessionId` in the JSON response:

```ts
// auth.login — change the return value from:
return { accessToken, user: toSafeUser(user) };
// to:
return { accessToken, sessionId: session.id, user: toSafeUser(user) };
```

This is backwards-compatible — the web ignores the new field.

### 2. Add `auth.refreshMobile` procedure

The existing `auth.refresh` reads the session ID from `ctx.sessionId`
(populated from the cookie). Mobile will send it as input instead.

Add a new public procedure:

```ts
refreshMobile: publicProcedure
  .input(z.object({ sessionId: z.string() }))
  .mutation(async ({ input }) => {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, input.sessionId))
      .limit(1);

    if (!session || session.expiresAt < new Date()) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Session expired' });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const accessToken = await signAccessToken(user.id);
    return { accessToken, user: toSafeUser(user) };
  }),
```

### 3. Enable WebSocket transport on the API server (if not already done)

Check `apps/api/src/index.ts`. If it only registers the HTTP tRPC adapter,
add the Fastify WebSocket adapter for `messages.subscribe`,
`likes.subscribeCount`, and `notifications.subscribe`:

```ts
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
// also register WS adapter:
import ws from '@fastify/websocket';
await app.register(ws);
// tRPC WS is handled by the same plugin when useWSS: true is passed
```

> See tRPC v11 Fastify adapter docs for the exact setup.

---

## Reuse from Web

These patterns are identical on mobile — copy/adapt rather than re-inventing:

| Web file | Mobile equivalent | Notes |
|---|---|---|
| `src/lib/trpc.ts` | `lib/trpc.ts` | Same `createTRPCReact<AppRouter>()`, different link setup |
| `src/lib/store.ts` | `lib/store.ts` | Same Zustand shape, add `sessionId`, swap cookie → SecureStore |
| `src/components/providers.tsx` | `components/Providers.tsx` | Same structure; `AuthBootstrap` uses `refreshMobile` |
| Feed infinite scroll logic | Same `useInfiniteQuery` pattern | Replace `IntersectionObserver` with `FlatList.onEndReached` |
| Optimistic like toggle | Identical mutation + cache logic | |
| Comment form + list | Same tRPC calls | |
| Post actions menu (archive/delete) | Same mutations | Use action sheet instead of dropdown |
| Notifications mark-all-read | Identical | |

### Type sharing

`@repo/shared` and `@repo/api` are already workspace packages. Add them to
`apps/mobile/package.json`:

```json
{
  "dependencies": {
    "@repo/shared": "workspace:*"
  },
  "devDependencies": {
    "@repo/api": "workspace:*"
  }
}
```

All tRPC input/output types are inferred — no manual type duplication needed.

---

## Development Tips

- **Metro bundler** doesn't support all Node.js built-ins. The API package
  imports Node-only modules (`pg`, `drizzle-orm`, etc.) — they must never
  be bundled into the app. The `@repo/api` devDependency is type-only
  (same as web); ensure Metro never resolves it at runtime.

- **Network on device/simulator:** replace `localhost` with your machine's
  LAN IP in `.env`. On Android emulator use `10.0.2.2` for host machine.

- **SecureStore** is not available in Expo Go on web — use
  `expo-secure-store` which falls back gracefully or wrap behind a platform
  check.

- **Image HEIC on Android:** Android doesn't support HEIC natively.
  `expo-image-picker` can convert to JPEG automatically — set
  `allowsEditing: false` and handle the mimeType returned by the picker.

- **FlatList vs ScrollView:** Always use `FlatList` (or `FlashList`) for
  the feed and comment lists. Never put a `FlatList` inside a `ScrollView`.
