'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Navbar } from '@/components/nav/navbar';
import { Spinner } from '@/components/ui/spinner';

interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  updatedAt: Date | string | null;
  lastMessageText: string | null;
  lastMessageAt: Date | string | null;
  unreadCount: number;
  members: { userId: string; username: string; avatarUrl: string | null }[];
}

function ConversationList({ onSelect }: { onSelect: (id: string, title: string) => void }) {
  const currentUser = useAuthStore((s) => s.user);
  const { data, isLoading } = trpc.conversations.list.useQuery();

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  const convos = (data ?? []) as Conversation[];

  if (convos.length === 0) {
    return <p className="text-center text-gray-500 text-sm py-8">No conversations yet.</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {convos.map((c) => {
        // For DMs, show the other person's name
        const title = c.isGroup
          ? (c.name ?? 'Group chat')
          : (c.members.find((m) => m.userId !== currentUser?.id)?.username ?? 'Unknown');

        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id, title)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
          >
            <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-base font-semibold text-gray-500 flex-shrink-0">
              {title[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{title}</p>
              <p className="text-xs text-gray-500 truncate">
                {c.lastMessageText ?? 'No messages'}
              </p>
            </div>
            {c.unreadCount > 0 && (
              <span className="bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                {c.unreadCount > 9 ? '9+' : c.unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ChatWindow({ conversationId }: { conversationId: string }) {
  const currentUser = useAuthStore((s) => s.user);
  const [text, setText] = useState('');
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.messages.history.useQuery({ conversationId, limit: 50 });

  const send = trpc.messages.send.useMutation({
    onSuccess: () => {
      setText('');
      utils.messages.history.invalidate({ conversationId });
    },
  });

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  const messages = data?.items ?? [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => {
          const isOwn = m.senderId === currentUser?.id;
          return (
            <div key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${
                  isOwn
                    ? 'bg-brand text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-gray-200 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            send.mutate({ conversationId, text: text.trim() });
          }}
          className="flex gap-2"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message…"
            className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:border-gray-400"
          />
          <button
            type="submit"
            disabled={!text.trim() || send.isPending}
            className="px-4 py-2 bg-brand text-white rounded-full text-sm font-semibold disabled:opacity-40 hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

function MessagesContent() {
  const [selected, setSelected] = useState<{ id: string; title: string } | null>(null);

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-3.5rem)] flex border-x border-gray-200">
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList onSelect={(id, title) => setSelected({ id, title })} />
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold">{selected.title}</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatWindow conversationId={selected.id} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p className="text-sm">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <AuthGuard>
      <Navbar />
      <main className="pt-14 h-screen overflow-hidden">
        <MessagesContent />
      </main>
    </AuthGuard>
  );
}
