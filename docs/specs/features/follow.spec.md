# Feature: Follow System
**Status:** Implemented
**Last updated:** 2026-02-25

## Overview
Users can follow and unfollow each other. Following affects the feed.

## User Stories
- [x] As a user, I can follow another user
- [x] As a user, I can unfollow a user
- [x] As a user, I can see my followers list (tappable from profile)
- [x] As a user, I can see who I'm following (tappable from profile)
- [x] As a user, I can see follower/following counts on profiles
- [x] As a user, I receive a notification when someone follows me

## Acceptance Criteria
- Follow is idempotent (following twice = no error, no duplicate)
- Unfollow removes posts from feed immediately
- Follower/following counts shown on profile header; counts are links/buttons to the respective list page
- Follow action triggers a notification to the followed user (see notifications spec)
- Followers/following lists are paginated (30 per page, cursor-based)

## Technical Notes
- follows table: (follower_id, following_id) composite primary key
- Feed query joins follows table to get relevant posts
- Follow notification: created server-side when follow is inserted
- `users.followers` and `users.following` procedures: public, paginate by followedAt ASC

## Out of Scope (v1)
- Private accounts (follow requests)
- Blocking users
- Restricting users
