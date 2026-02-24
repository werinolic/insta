# Feature: Posts & Feed
**Status:** Approved
**Last updated:** 2026-02-24

## Overview
Users can create posts with up to 10 photos, view a feed of posts from followed users,
and interact with posts.

## User Stories
- [ ] As a user, I can create a post with 1-10 photos
- [ ] As a user, I can write a caption up to 2200 characters
- [ ] As a user, I can reorder photos via drag and drop before posting
- [ ] As a user, I can tag other users in the caption via @mention
- [ ] As a user, I can see a feed of posts from people I follow (+ my own posts)
- [ ] As a user, I can view a single post with all its photos
- [ ] As a user, I can delete my own post
- [ ] As a user, I can view any user's posts on their profile page
- [ ] As a logged-out user, I can view any user's profile and posts

## Acceptance Criteria
- Max 10 media files per post
- Supported formats: JPEG, PNG, HEIC
- Max file size: 30MB per photo
- Images resized to: thumbnail (150px square), medium (600px wide), original stored
- Feed is paginated (cursor-based, 12 posts per page)
- Feed ordered by created_at DESC (chronological)
- Feed includes own posts + posts from followed users
- @mention in caption: parsed client-side for highlighting, creates a notification to mentioned user
- Carousel navigation: arrow keys on web, swipe on mobile

## Technical Notes
- Upload via MinIO presigned URLs (client uploads directly, not through API)
- Image processing: sharp (thumbnail + medium resize), synchronous on post creation
- Feed query: posts from followed users + own posts, keyset paginated on (created_at, id)
- @mention notification triggered on post creation for each unique mentioned username

## Out of Scope (v1)
- Video posts
- Post editing after publish
- Stories / Reels
- Location tagging
- NSFW moderation
- Hashtags
