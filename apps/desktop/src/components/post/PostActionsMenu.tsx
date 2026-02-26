import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';

interface PostActionsMenuProps {
  postId: string;
  postUserId: string;
  isArchived?: boolean;
}

export function PostActionsMenu({ postId, postUserId, isArchived }: PostActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const utils = trpc.useUtils();

  const isOwn = currentUser?.id === postUserId;

  const del = trpc.posts.delete.useMutation({
    onSuccess: () => {
      utils.posts.feed.invalidate();
      utils.posts.byUsername.invalidate();
      setOpen(false);
    },
  });

  const archive = trpc.posts.archive.useMutation({
    onSuccess: () => {
      utils.posts.feed.invalidate();
      utils.posts.byUsername.invalidate();
      utils.posts.archived.invalidate();
      setOpen(false);
    },
  });

  if (!isOwn) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px]">
            <button
              onClick={() => navigate(`/p/${postId}`)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
            >
              View post
            </button>
            <button
              onClick={() => archive.mutate({ postId })}
              disabled={archive.isPending}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
            >
              {isArchived ? 'Unarchive' : 'Archive'}
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this post?')) del.mutate({ postId });
              }}
              disabled={del.isPending}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
