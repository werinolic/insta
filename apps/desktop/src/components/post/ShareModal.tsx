import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';
import { Spinner } from '../ui/Spinner';

interface ShareModalProps {
  postId: string;
  onClose: () => void;
}

export function ShareModal({ postId, onClose }: ShareModalProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [sent, setSent] = useState<string | null>(null);

  const { data, isLoading } = trpc.conversations.list.useQuery();
  const send = trpc.messages.send.useMutation({
    onSuccess: (_, vars) => setSent(vars.conversationId),
  });

  const convos = (data ?? []) as {
    id: string;
    name: string | null;
    isGroup: boolean;
    members: { userId: string; username: string }[];
  }[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-sm">Share to…</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : convos.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-8">No conversations.</p>
        ) : (
          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {convos.map((c) => {
              const title = c.isGroup
                ? (c.name ?? 'Group chat')
                : (c.members.find((m) => m.userId !== currentUser?.id)?.username ?? 'Unknown');

              return (
                <button
                  key={c.id}
                  onClick={() =>
                    send.mutate({ conversationId: c.id, type: 'post_share', sharedPostId: postId })
                  }
                  disabled={send.isPending || sent === c.id}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 disabled:opacity-40 text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {title[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium flex-1 truncate">{title}</span>
                  {sent === c.id && (
                    <span className="text-xs text-green-600 font-semibold flex-shrink-0">Sent</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
