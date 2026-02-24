# Feature: Likes, Comments & Share
**Status:** Approved
**Last updated:** 2026-02-24

## Overview
Users can like posts, comment on them, reply to comments, and forward posts to friends via DM.

## User Stories
- [ ] As a user, I can like and unlike a post
- [ ] As a user, I can see the like count on a post (updates in real-time)
- [ ] As a user, I can see who liked a post
- [ ] As a user, I can comment on a post
- [ ] As a user, I can delete my own comment
- [ ] As a user, I can reply to a comment (nested one level deep)
- [ ] As a user, I can @mention another user in a comment
- [ ] As a user, I can forward a post to a friend via DM

## Acceptance Criteria
- Like is toggled (one request = like, second = unlike)
- Like action creates a notification for the post owner (if liker ≠ owner)
- Like count updates in real-time via SSE subscription
- Comment max length: 2200 characters
- Comment creates a notification for the post owner (if commenter ≠ owner)
- @mention in comment creates a notification for the mentioned user
- Comments paginated: 20 per page, oldest first, cursor-based
- Replies are one level deep only (no nested replies)
- Forwarding a post creates a message in DM with type 'post_share' and post preview

## Technical Notes
- Likes: toggle endpoint, unique constraint (user_id, post_id)
- Real-time like count: SSE subscription per post (consistent with ADR-003)
- Comments: tree structure limited to parent_id one level (parentId on comments table)
- Forward: creates a message record with type='post_share' and sharedPostId reference

## Out of Scope (v1)
- Comment likes
- Post saving / bookmarks
- Emoji reactions
