# Feature: Authentication & User Accounts
**Status:** Implemented
**Last updated:** 2026-02-25

## Overview
Users can register, log in, manage their profile and authenticate across web and mobile.

## User Stories
- [x] As a user, I can register with email + username + password
- [x] As a user, I can log in with email or username + password
- [x] As a user, I can log out from my current session
- [x] As a user, I can view and edit my profile (avatar, bio, website, name)
- [x] As a user, I can change my password
- [x] As a user, I can change my username (once per 14 days)
- [x] As a user, I stay logged in across browser refreshes (refresh tokens)
- [x] As a user, I can see my own profile page at /@username
- [x] As a logged-out user, I can view any public profile page at /@username
- [x] As a user, I can delete my account (requires password confirmation, cascades all data)

## Acceptance Criteria
- Password: min 8 chars, must contain letter + number
- Username: 3-30 chars, alphanumeric + underscores only, unique
- Username change: allowed max once every 14 days, new username must be unique
- Email: valid format, unique
- Access token: 15 min expiry, JWT
- Refresh token: 30 days expiry, stored in httpOnly cookie (web) / SecureStore (mobile)
- Avatar upload: JPEG/PNG, max 5MB, resized to 150x150
- Public profile pages are accessible without authentication
- Account deletion is permanent: all posts, sessions, follows, likes, and notifications are cascade-deleted

## Technical Notes
- Passwords hashed with bcrypt (rounds: 12)
- JWT via jose (HS256)
- Refresh tokens stored in DB (sessions table) for revocation support
- Avatar stored in MinIO, served via CDN path
- `usernameChangedAt` field on users table enforces 14-day cooldown
- Mobile auth: `sessionId` returned in JSON body at login/register; `auth.refreshMobile` procedure takes `sessionId` as input (no cookie)

## Out of Scope (v1)
- OAuth (Google, Facebook login)
- Two-factor authentication
- Email verification
- Password reset via email
- Email change
- Private accounts
