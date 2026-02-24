# Feature: Settings Page
**Status:** Approved
**Last updated:** 2026-02-24

## Overview
Users can manage their account settings.

## User Stories
- [ ] As a user, I can change my password
- [ ] As a user, I can change my username (once per 14 days)
- [ ] As a user, I can update my profile info (name, bio, website, avatar)
- [ ] As a user, I can delete my account

## Acceptance Criteria
- Password change requires current password confirmation, invalidates all sessions
- Username change enforces 14-day cooldown between changes
- Account deletion is permanent, requires password confirmation, deletes all posts and media
- Profile changes take effect immediately

## Out of Scope (v1)
- Email change
- Notification preferences
- Privacy settings
- Linked accounts
- Two-factor authentication
