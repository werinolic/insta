# Feature: Notifications
**Status:** Implemented
**Last updated:** 2026-02-25

## Overview
Users receive real-time notifications for social interactions involving them.

## User Stories
- [x] As a user, I receive a notification when someone likes my post
- [x] As a user, I receive a notification when someone comments on my post
- [x] As a user, I receive a notification when someone follows me
- [x] As a user, I receive a notification when someone @mentions me in a caption or comment
- [x] As a user, I receive a notification when someone sends me a DM
- [x] As a user, I can see a list of my recent notifications
- [x] As a user, I can see an unread notification count (badge)
- [x] As a user, notifications are marked as read when I open the notifications list

## Acceptance Criteria
- Notifications delivered in real-time via WebSocket subscription (`notifications.subscribe`)
- Notifications persisted in DB (survive page refresh)
- Notification types: `like` | `comment` | `follow` | `mention` | `message`
- No duplicate notifications: if an identical notification (same actor + recipient + type + postId) was created within the last hour, the new one is skipped
- Notification badge count shown in nav (web) / tab bar (mobile)
- Notifications paginated: 30 per page, newest first, cursor-based
- Self-actions do not generate notifications (liking your own post = no notification)
- Badge count seeded from `notifications.unreadCount` on app load; incremented in real-time via WS subscription

## Data Model
```
notifications(
  id           text PK
  recipientId  text → users.id
  actorId      text → users.id
  type         text  -- like | comment | follow | mention | message
  postId       text? → posts.id
  commentId    text? → comments.id
  read         boolean default false
  createdAt    timestamp
)
```

## Technical Notes
- Notifications written server-side at the point of action (like, comment, follow, mention, DM send)
- Real-time delivery: WebSocket subscription via tRPC `notifications.subscribe`; actor info and updated unread count are included in each pushed payload
- Badge count: `unreadCount` included in each push payload; client updates Zustand store on receipt
- Mention parsing: `parseMentions()` extracts `@usernames` from caption/comment text server-side, resolves to user IDs, creates one notification per mentioned user
- Deduplication logic lives in `createNotification()` helper (`apps/api/src/lib/notifications.ts`)

## Out of Scope (v1)
- Push notifications (mobile)
- Email notifications
- Notification preferences / mute
- Notification grouping (e.g. "X and 3 others liked your post")
