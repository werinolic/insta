'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';

interface PostActionsMenuProps {
  postId: string;
  postUserId: string;
  isArchived?: boolean;
  onDeleted?: () => void;
}

export function PostActionsMenu({ postId, postUserId, isArchived = false, onDeleted }: PostActionsMenuProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const utils = trpc.useUtils();

  const isOwn = currentUser?.id === postUserId;
  if (!isOwn) return null;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const archive = trpc.posts.archive.useMutation({
    onSuccess: () => {
      setOpen(false);
      utils.posts.feed.invalidate();
      utils.posts.byUsername.invalidate();
      utils.posts.archived.invalidate();
      utils.posts.byId.invalidate({ postId });
    },
  });

  const del = trpc.posts.delete.useMutation({
    onSuccess: () => {
      setOpen(false);
      utils.posts.feed.invalidate();
      utils.posts.byUsername.invalidate();
      utils.posts.archived.invalidate();
      onDeleted?.();
      router.push('/');
    },
  });

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => { setOpen((v) => !v); setConfirming(false); }}
        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Post options"
      >
        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg w-44 z-20 overflow-hidden">
          {!confirming ? (
            <>
              <button
                onClick={() => archive.mutate({ postId })}
                disabled={archive.isPending}
                className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
              >
                {archive.isPending
                  ? 'Working…'
                  : isArchived
                  ? 'Unarchive post'
                  : 'Archive post'}
              </button>
              <div className="h-px bg-gray-100" />
              <button
                onClick={() => setConfirming(true)}
                className="w-full px-4 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete post
              </button>
            </>
          ) : (
            <div className="p-3">
              <p className="text-xs text-gray-600 mb-3">Delete this post permanently?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => del.mutate({ postId })}
                  disabled={del.isPending}
                  className="flex-1 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {del.isPending ? '…' : 'Delete'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
