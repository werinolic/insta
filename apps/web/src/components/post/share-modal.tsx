'use client';

import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';

interface Props {
  postId: string;
  onClose: () => void;
}

export function ShareModal({ postId, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore((s) => s.user);
  const [sent, setSent] = useState<string | null>(null);

  const { data } = trpc.conversations.list.useQuery();
  const send = trpc.messages.send.useMutation({
    onSuccess: (_, vars) => setSent(vars.conversationId),
  });

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const conversations = (data ?? []) as {
    id: string; name: string | null; isGroup: boolean;
    members: { userId: string; username: string }[];
  }[];

  function getTitle(c: (typeof conversations)[0]) {
    return c.isGroup
      ? (c.name ?? 'Group chat')
      : (c.members.find((m) => m.userId !== currentUser?.id)?.username ?? 'Chat');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div ref={ref} className="bg-white rounded-2xl w-80 max-h-[70vh] flex flex-col shadow-xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold">Share to…</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1">
          {conversations.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">No conversations.</p>
          ) : (
            conversations.map((c) => {
              const title = getTitle(c);
              const isSent = sent === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    if (!isSent) send.mutate({ conversationId: c.id, type: 'post_share', sharedPostId: postId });
                  }}
                  disabled={send.isPending}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-500 flex-shrink-0">
                    {title[0].toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm font-medium truncate">{title}</span>
                  {isSent && <span className="text-xs text-green-600 font-semibold">Sent</span>}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
