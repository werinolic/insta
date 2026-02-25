'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useUIStore } from '@/lib/store';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Navbar } from '@/components/nav/navbar';
import { Spinner } from '@/components/ui/spinner';

interface NotifRow {
  id: string;
  type: string;
  read: boolean;
  postId: string | null;
  commentId: string | null;
  createdAt: Date | string;
  actorId: string;
  actorUsername: string;
  actorAvatarUrl: string | null;
}

function NotificationItem({ n }: { n: NotifRow }) {
  const text = () => {
    switch (n.type) {
      case 'like': return 'liked your post.';
      case 'comment': return 'commented on your post.';
      case 'follow': return 'started following you.';
      case 'mention': return 'mentioned you in a comment.';
      case 'message': return 'sent you a message.';
      default: return 'interacted with you.';
    }
  };

  const href =
    n.type === 'follow' ? `/${n.actorUsername}`
    : n.type === 'message' ? '/messages'
    : n.postId ? `/p/${n.postId}`
    : `/${n.actorUsername}`;

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
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50' : ''}`}
    >
      {n.actorAvatarUrl ? (
        <img src={n.actorAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {n.actorUsername[0].toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold">{n.actorUsername}</span>{' '}
          {text()}
        </p>
        <p className="text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
      </div>
      {!n.read && <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />}
    </Link>
  );
}

function NotificationsContent() {
  const setNotificationCount = useUIStore((s) => s.setNotificationCount);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.notifications.list.useQuery({ limit: 50 });

  const markAll = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      setNotificationCount(0);
      utils.notifications.list.invalidate();
    },
  });

  useEffect(() => {
    markAll.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  const items = data?.items ?? [];

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-lg font-semibold mb-4">Notifications</h1>
      {items.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No notifications yet.</p>
      ) : (
        <div className="space-y-px">
          {items.map((n) => (
            <NotificationItem key={n.id} n={n} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <Navbar />
      <main className="pt-14">
        <NotificationsContent />
      </main>
    </AuthGuard>
  );
}
