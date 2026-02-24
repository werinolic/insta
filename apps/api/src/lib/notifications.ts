import { db, notifications } from '@repo/db';

type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'message';

interface CreateNotificationInput {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  postId?: string;
  commentId?: string;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  // Never notify users about their own actions
  if (input.recipientId === input.actorId) return;

  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    recipientId: input.recipientId,
    actorId: input.actorId,
    type: input.type,
    postId: input.postId ?? null,
    commentId: input.commentId ?? null,
  });
}

export function parseMentions(text: string): string[] {
  const matches = text.matchAll(/@([a-zA-Z0-9_]{3,30})/g);
  return [...new Set([...matches].map((m) => m[1]))];
}
