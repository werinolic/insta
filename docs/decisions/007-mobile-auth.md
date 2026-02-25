# ADR-007: Mobile authentication — SecureStore + sessionId in response body

**Date:** 2026-02-25
**Status:** Accepted

## Context

The web client relies on an httpOnly session cookie to persist authentication
across page refreshes. The cookie is set by the API on login and read
automatically by the browser on every request.

React Native (Expo) cannot use httpOnly cookies. `fetch` on React Native does
not persist cookies between requests, and even if it did, httpOnly cookies
are not accessible to JavaScript by design.

## Decision

Extend the `auth.login` and `auth.register` responses to include `sessionId`
in the JSON body alongside the existing `accessToken` and `user` fields.

Mobile clients:
1. Store `accessToken` and `sessionId` in `expo-secure-store` (encrypted
   native storage, backed by Keychain on iOS and Keystore on Android).
2. Read `accessToken` from SecureStore on every tRPC request (in `headers()`).
3. On app launch, read `sessionId` from SecureStore and call a new
   `auth.refreshMobile` procedure (takes `sessionId` as input, not a cookie)
   to obtain a fresh access token.

The web client is unaffected — it ignores the new `sessionId` field in the
response body and continues to use the cookie.

## Consequences

+ No changes to the cookie-based web flow
+ Mobile tokens survive app restarts (SecureStore persists)
+ Single source of truth for sessions (DB `sessions` table)
+ `auth.refreshMobile` is a minimal new procedure (~15 lines)
- Two slightly different refresh paths to maintain (cookie vs. input)
- `sessionId` is now included in the JSON response — treat it as sensitive,
  do not log or expose it
