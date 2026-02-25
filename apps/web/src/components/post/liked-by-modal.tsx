'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { Spinner } from '@/components/ui/spinner';

interface Props {
  postId: string;
  onClose: () => void;
}

export function LikedByModal({ postId, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { data, isLoading } = trpc.likes.likedBy.useQuery({ postId, limit: 50 });

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const users = data?.items ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div ref={ref} className="bg-white rounded-2xl w-72 max-h-[70vh] flex flex-col shadow-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold">Liked by</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-6"><Spinner size="sm" /></div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-6">No likes yet.</p>
          ) : (
            users.map((u) => (
              <Link
                key={u.id}
                href={`/${u.username}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
              >
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {u.username[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{u.username}</p>
                  {u.fullName && <p className="text-xs text-gray-500 truncate">{u.fullName}</p>}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
