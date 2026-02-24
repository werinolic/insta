# Feature: Direct Messages & Group Chats
**Status:** Approved
**Last updated:** 2025-02-24

## Overview
Users can send direct messages to each other and create group chats.

## User Stories
- [ ] As a user, I can start a DM conversation with another user
- [ ] As a user, I can send text messages in a conversation
- [ ] As a user, I can send photos in a conversation
- [ ] As a user, I can see read receipts (seen/unseen)
- [ ] As a user, I can see typing indicator
- [ ] As a user, I can create a group chat with multiple users
- [ ] As a user, I can name a group chat
- [ ] As a user, I can add/remove members from a group chat (if I'm admin)
- [ ] As a user, I can forward a post into a conversation

## Acceptance Criteria
- Real-time delivery via WebSocket
- Messages persist in PostgreSQL
- Unread count shown in conversations list
- Typing indicator disappears after 3 seconds of inactivity
- Group chat: max 32 members
- Message max length: 2000 characters
- Photo messages: same upload flow as posts (presigned URLs)

## Technical Notes
- WebSocket server: Bun native WebSockets
- On connect: authenticate via JWT token in query param
- Redis pub/sub for horizontal scaling (future)
- Message types: text | photo | post_share

## Out of Scope (v1)
- Voice/video calls
- Message reactions
- Message editing/deletion
- Disappearing messages
