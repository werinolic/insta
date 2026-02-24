import { pgTable, text, integer, timestamp, boolean, uniqueIndex, index, primaryKey } from 'drizzle-orm/pg-core';

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name'),
  bio: text('bio'),
  website: text('website'),
  avatarUrl: text('avatar_url'),
  usernameChangedAt: timestamp('username_changed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('users_username_idx').on(t.username),
  uniqueIndex('users_email_idx').on(t.email),
]);

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('sessions_user_id_idx').on(t.userId),
]);

// ─── Follows ──────────────────────────────────────────────────────────────────

export const follows = pgTable('follows', {
  followerId: text('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: text('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.followerId, t.followingId] }),
  index('follows_follower_idx').on(t.followerId),
  index('follows_following_idx').on(t.followingId),
]);

// ─── Posts ────────────────────────────────────────────────────────────────────

export const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  caption: text('caption'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('posts_user_id_idx').on(t.userId),
  index('posts_created_at_idx').on(t.createdAt),
]);

// ─── Post Media ───────────────────────────────────────────────────────────────

export const postMedia = pgTable('post_media', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url').notNull(),
  mediumUrl: text('medium_url').notNull(),
  order: integer('order').notNull(),
  width: integer('width'),
  height: integer('height'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('post_media_post_id_idx').on(t.postId),
]);

// ─── Likes ────────────────────────────────────────────────────────────────────

export const likes = pgTable('likes', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.postId] }),
  index('likes_post_id_idx').on(t.postId),
]);

// ─── Comments ─────────────────────────────────────────────────────────────────

export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('comments_post_id_idx').on(t.postId),
  index('comments_user_id_idx').on(t.userId),
]);

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  recipientId: text('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actorId: text('actor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // like | comment | follow | mention | message
  postId: text('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  commentId: text('comment_id').references(() => comments.id, { onDelete: 'cascade' }),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('notifications_recipient_id_idx').on(t.recipientId),
  index('notifications_created_at_idx').on(t.createdAt),
]);

// ─── Conversations ────────────────────────────────────────────────────────────

export const conversations = pgTable('conversations', {
  id: text('id').primaryKey(),
  name: text('name'),
  isGroup: boolean('is_group').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Conversation Members ─────────────────────────────────────────────────────

export const conversationMembers = pgTable('conversation_members', {
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isAdmin: boolean('is_admin').notNull().default(false),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.conversationId, t.userId] }),
  index('conv_members_user_id_idx').on(t.userId),
]);

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('text'),
  text: text('text'),
  mediaUrl: text('media_url'),
  sharedPostId: text('shared_post_id').references(() => posts.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('messages_conversation_id_idx').on(t.conversationId),
  index('messages_created_at_idx').on(t.createdAt),
]);

// ─── Message Reads ────────────────────────────────────────────────────────────

export const messageReads = pgTable('message_reads', {
  messageId: text('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  readAt: timestamp('read_at').notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.messageId, t.userId] }),
]);
