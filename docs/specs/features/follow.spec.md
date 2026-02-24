# Feature: Follow System
**Status:** Approved
**Last updated:** 2025-02-24

## Overview
Users can follow and unfollow each other. Following affects the feed.

## User Stories
- [ ] As a user, I can follow another user
- [ ] As a user, I can unfollow a user
- [ ] As a user, I can see my followers list
- [ ] As a user, I can see who I'm following
- [ ] As a user, I can see follower/following counts on profiles

## Acceptance Criteria
- Follow is idempotent (following twice = no error, no duplicate)
- Unfollow removes from feed immediately
- Follower/following counts shown on profile

## Technical Notes
- follows table: (follower_id, following_id) unique constraint
- Feed query joins follows table to get relevant posts

## Out of Scope (v1)
- Private accounts (follow requests)
- Blocking users
