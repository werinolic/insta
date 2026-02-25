import { and, eq, isNull, sql } from 'drizzle-orm';
import { db, notifications, users } from '@repo/db';

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'message';

interface CreateNotificationInput {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  postId?: string;
  commentId?: string;
}

export interface NotificationPayload {
  id: string;
  type: string;
  postId: string | null;
  commentId: string | null;
  createdAt: Date;
  actorId: string;
  actorUsername: string;
  actorAvatarUrl: string | null;
  unreadCount: number;
}

// Registered by the notifications router on startup to avoid circular imports
let _emit: ((recipientId: string, payload: NotificationPayload) => void) | null = null;

export function registerNotificationEmitter(
  fn: (recipientId: string, payload: NotificationPayload) => void,
) {
  _emit = fn;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  if (input.recipientId === input.actorId) return;

  // Deduplication: skip if an identical notification was already created within the last hour
  // (e.g. like → unlike → like again should not spam the recipient)
  const [existing] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientId, input.recipientId),
        eq(notifications.actorId, input.actorId),
        eq(notifications.type, input.type),
        input.postId ? eq(notifications.postId, input.postId) : isNull(notifications.postId),
        sql`${notifications.createdAt} > now() - interval '1 hour'`,
      ),
    )
    .limit(1);

  if (existing) return;

  const id = crypto.randomUUID();

  await db.insert(notifications).values({
    id,
    recipientId: input.recipientId,
    actorId: input.actorId,
    type: input.type,
    postId: input.postId ?? null,
    commentId: input.commentId ?? null,
  });

  if (!_emit) return;

  const [actor] = await db
    .select({ username: users.username, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, input.actorId))
    .limit(1);

  const [unreadRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.recipientId, input.recipientId), eq(notifications.read, false)));

  _emit(input.recipientId, {
    id,
    type: input.type,
    postId: input.postId ?? null,
    commentId: input.commentId ?? null,
    createdAt: new Date(),
    actorId: input.actorId,
    actorUsername: actor?.username ?? '',
    actorAvatarUrl: actor?.avatarUrl ?? null,
    unreadCount: Number(unreadRow?.count ?? 1),
  });
}

export function parseMentions(text: string): string[] {
  const matches = text.matchAll(/@([a-zA-Z0-9_]{3,30})/g);
  return [...new Set([...matches].map((m) => m[1]))];
}
