# Feature: Direct Messages & Group Chats
**Status:** Approved
**Last updated:** 2026-02-24

## Overview
Users can send direct messages to each other and create group chats.

## User Stories
- [ ] As a user, I can start a DM conversation with another user
- [ ] As a user, I can send text messages in a conversation
- [ ] As a user, I can send photos in a conversation
- [ ] As a user, I can see read receipts (seen/unseen)
- [ ] As a user, I can see a typing indicator when the other user is typing
- [ ] As a user, I can create a group chat with multiple users
- [ ] As a user, I can name a group chat
- [ ] As a user, I can add/remove members from a group chat (if I'm admin)
- [ ] As a user, I can forward a post into a conversation
- [ ] As a user, I receive a notification when I get a new DM

## Acceptance Criteria
- Real-time delivery via WebSocket (tRPC subscription)
- Messages persist in PostgreSQL
- Unread count shown in conversations list
- Typing indicator disappears after 3 seconds of inactivity
- Group chat: max 32 members
- Message max length: 2000 characters
- Photo messages: same presigned URL upload flow as posts
- New DM triggers a notification to recipient (see notifications spec)

## Technical Notes
- WebSocket transport via tRPC subscription
- Auth on WebSocket: JWT passed as query param on connection (`?token=<jwt>`)
- Message types: text | photo | post_share
- Read receipts: written to message_reads table when user views conversation
- Typing indicator: ephemeral WS event, not persisted
- Redis pub/sub for horizontal scaling (future — out of scope v1)

## Out of Scope (v1)
- Voice/video calls
- Message reactions
- Message editing/deletion
- Disappearing messages
- Message search
