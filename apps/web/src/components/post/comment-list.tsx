'use client';

import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';
import { Spinner } from '@/components/ui/spinner';

interface CommentRow {
  id: string;
  text: string;
  parentId: string | null;
  createdAt: Date | string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  replies?: CommentRow[];
}

function CommentItem({ comment, postId }: { comment: CommentRow; postId: string }) {
  const currentUser = useAuthStore((s) => s.user);
  const utils = trpc.useUtils();

  const del = trpc.comments.delete.useMutation({
    onSettled: () => utils.comments.list.invalidate({ postId }),
  });

  const timeAgo = (date: Date | string) => {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="flex gap-2.5">
      <Link href={`/${comment.username}`} className="flex-shrink-0">
        {comment.avatarUrl ? (
          <img src={comment.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
            {comment.username[0].toUpperCase()}
          </div>
        )}
      </Link>
      <div className="flex-1">
        <p className="text-sm">
          <Link href={`/${comment.username}`} className="font-semibold mr-1.5 hover:underline">
            {comment.username}
          </Link>
          {comment.text}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
          {currentUser?.id === comment.userId && (
            <button
              onClick={() => del.mutate({ commentId: comment.id })}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              Delete
            </button>
          )}
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-100">
            {comment.replies.map((r) => (
              <CommentItem key={r.id} comment={r} postId={postId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentList({ postId }: { postId: string }) {
  const { data, isLoading } = trpc.comments.list.useQuery({ postId, limit: 50 });

  if (isLoading) return <div className="flex justify-center py-4"><Spinner size="sm" /></div>;

  const comments = data?.items ?? [];
  if (comments.length === 0) return <p className="text-sm text-gray-400">No comments yet.</p>;

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <CommentItem key={c.id} comment={c} postId={postId} />
      ))}
    </div>
  );
}
