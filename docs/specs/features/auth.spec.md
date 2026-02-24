# Feature: Authentication & User Accounts
**Status:** Approved
**Last updated:** 2026-02-24

## Overview
Users can register, log in, manage their profile and authenticate across web and mobile.

## User Stories
- [ ] As a user, I can register with email + username + password
- [ ] As a user, I can log in with email or username + password
- [ ] As a user, I can log out from my current session
- [ ] As a user, I can view and edit my profile (avatar, bio, website, name)
- [ ] As a user, I can change my password
- [ ] As a user, I can change my username (once per 14 days)
- [ ] As a user, I stay logged in across browser refreshes (refresh tokens)
- [ ] As a user, I can see my own profile page at /@username
- [ ] As a logged-out user, I can view any public profile page at /@username

## Acceptance Criteria
- Password: min 8 chars, must contain letter + number
- Username: 3-30 chars, alphanumeric + underscores only, unique
- Username change: allowed max once every 14 days, new username must be unique
- Email: valid format, unique
- Access token: 15 min expiry, JWT
- Refresh token: 30 days expiry, stored in httpOnly cookie
- Avatar upload: JPEG/PNG, max 5MB, resized to 150x150
- Public profile pages are accessible without authentication

## Technical Notes
- Passwords hashed with bcrypt (rounds: 12)
- JWT via jose (HS256)
- Refresh tokens stored in DB (sessions table) for revocation support
- Avatar stored in MinIO, served via CDN path
- Username change must update `updatedAt` and enforce 14-day cooldown (track `usernameChangedAt` field — requires schema addition)

## Out of Scope (v1)
- OAuth (Google, Facebook login)
- Two-factor authentication
- Email verification
- Password reset via email
- Email change
- Private accounts
