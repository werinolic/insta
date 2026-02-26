import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { FilePickerButton } from '@/components/FilePickerButton';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';
import { Spinner } from '@/components/ui/Spinner';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  updatedAt: Date | string | null;
  lastMessageText: string | null;
  lastMessageAt: Date | string | null;
  unreadCount: number;
  members: { userId: string; username: string; avatarUrl: string | null; isAdmin: boolean }[];
}

interface Message {
  id: string;
  text: string | null;
  mediaUrl: string | null;
  senderId: string;
  senderUsername: string;
  type: string;
  sharedPostId: string | null;
  createdAt: string;
  isTyping?: boolean;
}

// ─── New Conversation Panel ────────────────────────────────────────────────
function NewConversationPanel({
  onCreated,
  onCancel,
}: {
  onCreated: (id: string, title: string) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<'dm' | 'group'>('dm');
  const [query, setQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selected, setSelected] = useState<{ username: string; avatarUrl: string | null }[]>([]);
  const utils = trpc.useUtils();

  const { data: searchResults, isLoading: searching } = trpc.users.search.useQuery(
    { query },
    { enabled: query.length > 0 },
  );

  const createConvo = trpc.conversations.create.useMutation({
    onSuccess: async (result, vars) => {
      await utils.conversations.list.invalidate();
      const title =
        mode === 'group'
          ? groupName.trim() || vars.memberUsernames.join(', ')
          : vars.memberUsernames[0];
      onCreated(result.conversationId, title);
    },
  });

  function handleSelectUser(u: { username: string; avatarUrl: string | null }) {
    if (mode === 'dm') {
      createConvo.mutate({ memberUsernames: [u.username] });
    } else {
      if (!selected.find((s) => s.username === u.username)) {
        setSelected((prev) => [...prev, u]);
        setQuery('');
      }
    }
  }

  const filteredResults = (searchResults ?? []).filter(
    (u) => !selected.find((s) => s.username === u.username),
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-gray-200 flex items-center gap-2 flex-shrink-0">
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 text-lg leading-none px-1">
          ‹
        </button>
        <div className="flex-1 flex bg-gray-100 rounded-full overflow-hidden text-xs font-medium">
          <button
            onClick={() => { setMode('dm'); setSelected([]); }}
            className={`flex-1 py-1.5 transition-colors ${mode === 'dm' ? 'bg-brand text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            DM
          </button>
          <button
            onClick={() => setMode('group')}
            className={`flex-1 py-1.5 transition-colors ${mode === 'group' ? 'bg-brand text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Group
          </button>
        </div>
      </div>

      {mode === 'group' && (
        <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0 space-y-2">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name (optional)"
            className="w-full text-sm bg-gray-100 rounded-lg px-3 py-1.5 focus:outline-none"
          />
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((u) => (
                <span key={u.username} className="flex items-center gap-1 bg-brand/10 text-brand text-xs rounded-full pl-2 pr-1 py-0.5">
                  {u.username}
                  <button
                    onClick={() => setSelected((prev) => prev.filter((s) => s.username !== u.username))}
                    className="text-brand/60 hover:text-brand leading-none"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
          {selected.length >= 1 && (
            <button
              onClick={() =>
                createConvo.mutate({
                  memberUsernames: selected.map((u) => u.username),
                  name: groupName.trim() || undefined,
                })
              }
              disabled={createConvo.isPending}
              className="w-full py-1.5 bg-brand text-white text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-blue-600 transition-colors"
            >
              {createConvo.isPending ? 'Creating…' : `Create group (${selected.length + 1} members)`}
            </button>
          )}
        </div>
      )}

      <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === 'group' ? 'Add people…' : 'Search people…'}
          className="w-full text-sm bg-gray-100 rounded-full px-3 py-1.5 focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {searching && <div className="flex justify-center py-4"><Spinner /></div>}
        {filteredResults.map((u) => (
          <button
            key={u.id}
            onClick={() => handleSelectUser(u)}
            disabled={createConvo.isPending}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
          >
            {u.avatarUrl ? (
              <img src={u.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-500 flex-shrink-0">
                {u.username[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{u.username}</p>
              {u.fullName && <p className="text-xs text-gray-500 truncate">{u.fullName}</p>}
            </div>
          </button>
        ))}
        {query && !searching && filteredResults.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-6">No users found.</p>
        )}
      </div>
    </div>
  );
}

// ─── Group Members Panel ───────────────────────────────────────────────────
function GroupMembersPanel({ conversation, onClose }: { conversation: Conversation; onClose: () => void }) {
  const currentUser = useAuthStore((s) => s.user);
  const [query, setQuery] = useState('');
  const utils = trpc.useUtils();

  const isAdmin = conversation.members.find((m) => m.userId === currentUser?.id)?.isAdmin ?? false;

  const { data: searchResults } = trpc.users.search.useQuery(
    { query },
    { enabled: query.length > 0 },
  );

  const addMember = trpc.conversations.addMember.useMutation({
    onSuccess: () => { setQuery(''); utils.conversations.list.invalidate(); },
  });

  const removeMember = trpc.conversations.removeMember.useMutation({
    onSuccess: () => utils.conversations.list.invalidate(),
  });

  const filteredResults = (searchResults ?? []).filter(
    (u) => !conversation.members.find((m) => m.username === u.username),
  );

  return (
    <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Members</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
      </div>

      <ul className="space-y-1.5">
        {conversation.members.map((m) => (
          <li key={m.userId} className="flex items-center gap-2">
            {m.avatarUrl ? (
              <img src={m.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500 flex-shrink-0">
                {m.username[0].toUpperCase()}
              </div>
            )}
            <span className="text-sm flex-1 truncate">{m.username}</span>
            {m.isAdmin && <span className="text-xs text-gray-400">admin</span>}
            {isAdmin && m.userId !== currentUser?.id && (
              <button
                onClick={() => removeMember.mutate({ conversationId: conversation.id, username: m.username })}
                disabled={removeMember.isPending}
                className="text-red-400 hover:text-red-600 text-xs disabled:opacity-40"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      {isAdmin && (
        <div className="space-y-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Add member…"
            className="w-full text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none"
          />
          {filteredResults.map((u) => (
            <button
              key={u.id}
              onClick={() => addMember.mutate({ conversationId: conversation.id, username: u.username })}
              disabled={addMember.isPending}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white text-left text-xs disabled:opacity-40"
            >
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500 flex-shrink-0">
                  {u.username[0].toUpperCase()}
                </div>
              )}
              <span className="font-medium truncate">{u.username}</span>
              {u.fullName && <span className="text-gray-400 truncate">{u.fullName}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Conversation List ─────────────────────────────────────────────────────
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
              <p className="text-xs text-gray-500 truncate">{c.lastMessageText ?? 'No messages'}</p>
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

// ─── Chat Window ───────────────────────────────────────────────────────────
function ChatWindow({ conversationId }: { conversationId: string }) {
  const currentUser = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const [text, setText] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.messages.history.useQuery({ conversationId, limit: 50 });
  const { data: seenData } = trpc.messages.lastSeen.useQuery({ conversationId });

  const send = trpc.messages.send.useMutation({
    onSuccess: () => {
      setText('');
      utils.messages.history.invalidate({ conversationId });
    },
  });

  const sendTyping = trpc.messages.typing.useMutation();

  trpc.messages.subscribe.useSubscription(
    { conversationId },
    {
      onData: (msg: Message) => {
        if (msg.isTyping) {
          if (msg.senderId !== currentUser?.id) {
            setTypingUser(msg.senderUsername);
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => setTypingUser(null), 3000);
          }
        } else {
          setLiveMessages((prev) => [...prev, msg]);
          setTypingUser(null);
        }
      },
    },
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages, data]);

  const handleTextChange = useCallback(
    (val: string) => {
      setText(val);
      if (val) sendTyping.mutate({ conversationId });
    },
    [conversationId],
  );

  async function handleImagePick(files: import('@/components/FilePickerButton').PickedFile[]) {
    const file = files[0];
    if (!file || !token) return;
    setImageUploading(true);
    try {
      const res = await fetch(
        `${API_URL}/upload?purpose=post&filename=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          body: file.blob,
          headers: { 'Content-Type': file.mimeType, Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error('Upload failed');
      const { mediumUrl } = (await res.json()) as { mediumUrl: string };
      send.mutate({ conversationId, type: 'photo', mediaUrl: mediumUrl });
    } finally {
      setImageUploading(false);
    }
  }

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  const historical = (data?.items ?? []) as Message[];
  const liveIds = new Set(historical.map((m) => m.id));
  const allMessages = [...historical, ...liveMessages.filter((m) => !liveIds.has(m.id))];

  const lastReadMessageId = seenData?.lastReadMessageId ?? null;
  const outgoingMsgs = allMessages.filter((m) => m.senderId === currentUser?.id);
  const lastOutgoingId = outgoingMsgs.length > 0 ? outgoingMsgs[outgoingMsgs.length - 1].id : null;
  const seenMessageId =
    lastOutgoingId && lastOutgoingId === lastReadMessageId ? lastOutgoingId : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {allMessages.map((m) => {
          const isOwn = m.senderId === currentUser?.id;
          return (
            <div key={m.id}>
              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs rounded-2xl overflow-hidden text-sm ${
                    isOwn
                      ? 'bg-brand text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  } ${m.type === 'photo' ? '' : 'px-3 py-2'}`}
                >
                  {m.type === 'photo' && m.mediaUrl ? (
                    <img
                      src={m.mediaUrl}
                      alt=""
                      className="max-w-[240px] max-h-[240px] object-cover block"
                    />
                  ) : m.type === 'post_share' ? (
                    <span className="italic text-xs opacity-80">📷 Shared a post</span>
                  ) : (
                    m.text
                  )}
                </div>
              </div>
              {seenMessageId === m.id && (
                <div className="flex justify-end mt-0.5">
                  <span className="text-xs text-gray-400">Seen ✓✓</span>
                </div>
              )}
            </div>
          );
        })}

        {typingUser && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 text-xs px-3 py-2 rounded-2xl rounded-bl-sm">
              {typingUser} is typing…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            send.mutate({ conversationId, text: text.trim() });
          }}
          className="flex gap-2 items-center"
        >
          <FilePickerButton
            onFiles={handleImagePick}
            disabled={imageUploading}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
          >
            {imageUploading ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8.5" cy="8.5" r="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="21 15 16 10 5 21" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </FilePickerButton>
          <input
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
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

// ─── Messages Page ─────────────────────────────────────────────────────────
function MessagesContent() {
  const [selected, setSelected] = useState<{ id: string; title: string } | null>(null);
  const [composing, setComposing] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const { data: convList } = trpc.conversations.list.useQuery();
  const selectedConversation = selected
    ? ((convList ?? []) as Conversation[]).find((c) => c.id === selected.id) ?? null
    : null;

  return (
    <div className="h-full flex border-x border-gray-200 max-w-4xl mx-auto">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col flex-shrink-0">
        {composing ? (
          <NewConversationPanel
            onCreated={(id, title) => { setSelected({ id, title }); setComposing(false); }}
            onCancel={() => setComposing(false)}
          />
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h1 className="text-lg font-semibold">Messages</h1>
              <button
                onClick={() => setComposing(true)}
                title="New message"
                className="text-gray-500 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                onSelect={(id, title) => { setSelected({ id, title }); setShowMembers(false); }}
              />
            </div>
          </>
        )}
      </div>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="font-semibold">{selected.title}</h2>
              {selectedConversation?.isGroup && (
                <button
                  onClick={() => setShowMembers((v) => !v)}
                  title="Members"
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {selectedConversation?.isGroup && showMembers && (
                <GroupMembersPanel
                  conversation={selectedConversation}
                  onClose={() => setShowMembers(false)}
                />
              )}
              <div className="flex-1 overflow-hidden">
                <ChatWindow conversationId={selected.id} />
              </div>
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
      <div className="h-full overflow-hidden">
        <MessagesContent />
      </div>
    </AuthGuard>
  );
}
