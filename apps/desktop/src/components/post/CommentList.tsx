import { useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';
import { renderMentions } from '@/lib/mentions';
import { Spinner } from '../ui/Spinner';

interface CommentListProps {
  postId: string;
}

export function CommentList({ postId }: CommentListProps) {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.comments.list.useQuery({ postId });

  const del = trpc.comments.delete.useMutation({
    onSuccess: () => utils.comments.list.invalidate({ postId }),
  });

  if (isLoading) return <div className="flex justify-center py-4"><Spinner size="sm" /></div>;

  const items = data?.items ?? [];

  if (items.length === 0) {
    return <p className="text-xs text-gray-400 py-3">No comments yet.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((c) => (
        <div key={c.id} className="flex gap-2 group">
          <button onClick={() => navigate(`/${c.username}`)} className="flex-shrink-0">
            {c.avatarUrl ? (
              <img src={c.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                {c.username[0].toUpperCase()}
              </div>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <button
                onClick={() => navigate(`/${c.username}`)}
                className="font-semibold mr-1 hover:underline"
              >
                {c.username}
              </button>
              {renderMentions(c.text)}
            </p>
          </div>
          {currentUser?.id === c.userId && (
            <button
              onClick={() => del.mutate({ commentId: c.id })}
              disabled={del.isPending}
              className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-red-500 transition-opacity flex-shrink-0"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
