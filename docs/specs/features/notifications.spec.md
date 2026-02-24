# Feature: Notifications
**Status:** Approved
**Last updated:** 2026-02-24

## Overview
Users receive real-time notifications for social interactions involving them.

## User Stories
- [ ] As a user, I receive a notification when someone likes my post
- [ ] As a user, I receive a notification when someone comments on my post
- [ ] As a user, I receive a notification when someone follows me
- [ ] As a user, I receive a notification when someone @mentions me in a caption or comment
- [ ] As a user, I receive a notification when someone sends me a DM
- [ ] As a user, I can see a list of my recent notifications
- [ ] As a user, I can see an unread notification count (badge)
- [ ] As a user, notifications are marked as read when I open the notifications list

## Acceptance Criteria
- Notifications delivered in real-time via SSE (tRPC subscription, consistent with ADR-003)
- Notifications persisted in DB (survive page refresh)
- Notification types: like | comment | follow | mention | message
- No duplicate notifications (e.g. user likes then unlikes then relikes = 1 notification max per hour per actor+target pair)
- Notification badge count shown in nav/tab bar
- Notifications paginated: 30 per page, newest first, cursor-based
- Self-actions do not generate notifications (liking your own post = no notification)

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
- SSE subscription: client subscribes on login, receives notification payloads in real-time
- Badge count: sum of unread notifications, updated via SSE event
- Mention parsing: extract @usernames from caption/comment text on server, resolve to user IDs

## Out of Scope (v1)
- Push notifications (mobile)
- Email notifications
- Notification preferences / mute
- Notification grouping (e.g. "X and 3 others liked your post")
