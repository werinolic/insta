# Feature: Direct Messages & Group Chats
**Status:** Implemented
**Last updated:** 2026-02-25

## Overview
Users can send direct messages to each other, create group chats, share photos,
forward posts, and manage group membership.

## User Stories
- [x] As a user, I can start a DM conversation with another user
- [x] As a user, I can send text messages in a conversation
- [x] As a user, I can send photos in a conversation
- [x] As a user, I can see read receipts ("Seen ✓✓" shown under last outgoing message the recipient has read)
- [x] As a user, I can see a typing indicator when the other user is typing
- [x] As a user, I can create a group chat with multiple users
- [x] As a user, I can name a group chat
- [x] As a user, I can add/remove members from a group chat (admins only)
- [x] As a user, I can forward a post into a conversation
- [x] As a user, I receive a notification when I get a new DM

## Acceptance Criteria
- Real-time delivery via WebSocket (tRPC subscription — `messages.subscribe`)
- Messages persist in PostgreSQL
- Unread count shown in conversations list
- Typing indicator disappears after 3 seconds of inactivity
- Group chat: max 32 members
- Message max length: 2000 characters
- Photo messages: uploaded via `POST /upload` endpoint; `mediumUrl` stored as `mediaUrl` on message
- New DM triggers a notification to the recipient
- Read receipts: "Seen ✓✓" shown under the last outgoing message whose ID has been recorded in `message_reads` by another member
- New conversation: compose button opens DM/Group toggle panel with user search

## Technical Notes
- WebSocket transport via tRPC subscription; same `wsLink` used for all real-time subscriptions
- Auth on WebSocket: JWT passed as query param on connection (`?token=<jwt>`)
- Message types: `text` | `photo` | `post_share`
- Read receipts: written to `message_reads` table when user fetches conversation history; `messages.lastSeen` procedure returns the most recent message read by any non-self member
- Typing indicator: ephemeral WS event (`messages.typing` mutation), not persisted; 3-second client-side timeout
- Group member management: `conversations.addMember` / `conversations.removeMember` — admin-only; inline panel in chat UI on both web and mobile
- Creator of a group/DM is set as `isAdmin = true`; added members get `isAdmin = false`
- Redis pub/sub for horizontal scaling: deferred to v2

## Out of Scope (v1)
- Voice/video calls
- Message reactions
- Message editing/deletion
- Disappearing messages
- Message search
