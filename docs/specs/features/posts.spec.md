# Feature: Posts & Feed
**Status:** Implemented
**Last updated:** 2026-02-25

## Overview
Users can create posts with up to 10 photos, view a feed of posts from followed users,
interact with posts, archive them, and discover public posts via the Explore page.

## User Stories
- [x] As a user, I can create a post with 1-10 photos
- [x] As a user, I can write a caption up to 2200 characters
- [x] As a user, I can reorder photos before posting (‹ › buttons on mobile; keyboard ←→ for carousel on web)
- [x] As a user, I can tag other users in the caption via @mention
- [x] As a user, I can see a feed of posts from people I follow (+ my own posts)
- [x] As a user, I can view a single post with all its photos
- [x] As a user, I can delete my own post
- [x] As a user, I can view any user's posts on their profile page
- [x] As a logged-out user, I can view any user's profile and posts
- [x] As a user, I can archive a post (hides it from public view, visible only to me)
- [x] As a user, I can unarchive a post
- [x] As a user, I can view a grid of all my archived posts
- [x] As a user, I can browse a public Explore page showing all posts (not just followed users)

## Acceptance Criteria
- Max 10 media files per post
- Supported formats: JPEG, PNG, HEIC
- Max file size: 30MB per photo
- Images resized to: thumbnail (150px square), medium (600px wide), original stored
- Feed is paginated (cursor-based, 12 posts per page)
- Feed ordered by created_at DESC (chronological)
- Feed includes own posts + posts from followed users
- @mention in caption: highlighted client-side as links to user profiles, creates a notification to each mentioned user
- Carousel navigation: ← → keys on web (tabIndex on media container), swipe on mobile
- Archived posts are excluded from the public feed, profile grid, and Explore
- Explore page: cursor-paginated grid of all non-archived posts, 24 per page

## Technical Notes
- Upload flow: client sends file to `POST /upload` REST endpoint on the API; API processes with sharp, uploads variants to MinIO, returns `{ key, url, thumbnailUrl, mediumUrl, width, height }`
- Image processing: sharp (thumbnail + medium resize), synchronous on upload
- Feed query: posts from followed users + own posts, keyset paginated on (created_at, id)
- @mention notification triggered on post creation for each unique mentioned username
- Archive toggle: `posts.archive` procedure sets/clears `archivedAt` on the post row

## Out of Scope (v1)
- Video posts
- Post editing after publish
- Stories / Reels
- Location tagging
- NSFW moderation
- Hashtags
- Post search (by caption)
