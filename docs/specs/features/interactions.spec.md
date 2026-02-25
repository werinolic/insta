# Feature: Likes, Comments & Share
**Status:** Implemented
**Last updated:** 2026-02-25

## Overview
Users can like posts, comment on them, reply to comments, see who liked a post,
and forward posts to friends via DM.

## User Stories
- [x] As a user, I can like and unlike a post
- [x] As a user, I can see the like count on a post (updates in real-time on post detail)
- [x] As a user, I can see who liked a post (likers list modal on web; dedicated screen on mobile)
- [x] As a user, I can comment on a post
- [x] As a user, I can delete my own comment
- [x] As a user, I can reply to a comment (nested one level deep)
- [x] As a user, I can @mention another user in a comment
- [x] As a user, I can forward a post to a friend via DM

## Acceptance Criteria
- Like is toggled (one request = like, second = unlike)
- Like action creates a notification for the post owner (if liker ≠ owner)
- Like count updates in real-time on the post detail page via WebSocket subscription (`likes.subscribeCount`)
- Feed/grid cards use optimistic like toggle without a live subscription
- Comment max length: 2200 characters
- Comment creates a notification for the post owner (if commenter ≠ owner)
- @mention in comment creates a notification for the mentioned user; mentions are highlighted as links
- Comments paginated: 20 per page, oldest first, cursor-based
- Replies are one level deep only (no nested replies)
- Forwarding a post creates a message in DM with type `post_share` and renders a "📷 Shared a post" preview
- Deduplication: no duplicate like notifications within 1 hour for the same actor+post pair

## Technical Notes
- Likes: toggle endpoint, unique constraint (user_id, post_id)
- Real-time like count: WebSocket subscription (`likes.subscribeCount`) per post — used only on post detail page; `pendingRef` prevents conflict with optimistic UI
- Comments: tree structure limited to parent_id one level (parentId on comments table)
- Forward: creates a message record with type=`post_share` and sharedPostId reference
- @mention highlighting: `renderMentions()` on web (Next.js Link), `MentionText` component on mobile

## Out of Scope (v1)
- Comment likes
- Post saving / bookmarks
- Emoji reactions
