# Feature: Likes, Comments & Share
**Status:** Approved
**Last updated:** 2025-02-24

## Overview
Users can like posts, comment on them, and forward posts to friends.

## User Stories
- [ ] As a user, I can like and unlike a post
- [ ] As a user, I can see the like count on a post
- [ ] As a user, I can see who liked a post
- [ ] As a user, I can comment on a post
- [ ] As a user, I can delete my own comment
- [ ] As a user, I can reply to a comment
- [ ] As a user, I can forward a post to a friend via DM

## Acceptance Criteria
- Like is toggled (one request = like, second = unlike)
- Comment max length: 2200 characters
- Comments paginated: 20 per page, oldest first
- Forwarding a post creates a message in DM with post preview
- Like count updates in real-time via WebSocket

## Technical Notes
- Likes: simple toggle endpoint, unique constraint (user_id, post_id)
- Real-time like count: WebSocket broadcast to all viewers of the post
- Forward: creates a message record with type 'post_share' and post_id reference
