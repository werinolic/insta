# Feature: Follow System
**Status:** Approved
**Last updated:** 2026-02-24

## Overview
Users can follow and unfollow each other. Following affects the feed.

## User Stories
- [ ] As a user, I can follow another user
- [ ] As a user, I can unfollow a user
- [ ] As a user, I can see my followers list
- [ ] As a user, I can see who I'm following
- [ ] As a user, I can see follower/following counts on profiles
- [ ] As a user, I receive a notification when someone follows me

## Acceptance Criteria
- Follow is idempotent (following twice = no error, no duplicate)
- Unfollow removes posts from feed immediately
- Follower/following counts shown on profile
- Follow action triggers a notification to the followed user (see notifications spec)

## Technical Notes
- follows table: (follower_id, following_id) composite primary key
- Feed query joins follows table to get relevant posts
- Follow notification: created server-side when follow is inserted

## Out of Scope (v1)
- Private accounts (follow requests)
- Blocking users
- Restricting users
