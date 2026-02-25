# Feature: Settings & Account Management
**Status:** Implemented
**Last updated:** 2026-02-25

## Overview
Users can manage their account settings, including profile information, credentials,
archived posts, and account deletion.

## User Stories
- [x] As a user, I can change my password
- [x] As a user, I can change my username (once per 14 days)
- [x] As a user, I can update my profile info (name, bio, website, avatar)
- [x] As a user, I can view and manage my archived posts (unarchive or permanently delete)
- [x] As a user, I can delete my account

## Acceptance Criteria
- Password change requires current password confirmation, invalidates all sessions
- Username change enforces 14-day cooldown between changes
- Account deletion is permanent, requires password confirmation, cascades all posts, sessions, follows, likes, comments, and notifications
- Profile changes (name, bio, website, avatar) take effect immediately
- Avatar upload: JPEG/PNG/WebP, max 5MB, resized to 150×150 via `POST /upload`
- Archived posts: shown in a private grid; each post can be unarchived or deleted
- Settings menu available from the profile tab/page on both web and mobile

## Out of Scope (v1)
- Email change
- Notification preferences
- Privacy settings (private account)
- Linked accounts
- Two-factor authentication
- Data export
