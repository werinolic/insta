import { useEffect, useRef } from 'react';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { trpc } from '@/lib/trpc';
import { useAuthStore, useUIStore } from '@/lib/store';

// Subscribes to the SSE notification stream.
// When the app window is NOT focused, fires a native OS notification.
// Also keeps the in-memory unread count up to date.
export function NotifDispatcher() {
  const user = useAuthStore((s) => s.user);
  const notificationCount = useUIStore((s) => s.notificationCount);
  const setNotificationCount = useUIStore((s) => s.setNotificationCount);
  const countRef = useRef(notificationCount);
  countRef.current = notificationCount;

  // Seed unread count on mount
  const { data } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: !!user,
  });
  useEffect(() => {
    if (data != null) setNotificationCount(data.count);
  }, [data, setNotificationCount]);

  // SSE subscription for live notifications
  trpc.notifications.subscribe.useSubscription(undefined, {
    enabled: !!user,
    onData: async (notif) => {
      setNotificationCount(countRef.current + 1);

      // Only fire native notification when the window is in the background
      const focused = await getCurrentWindow().isFocused().catch(() => true);
      if (focused) return;

      let granted = await isPermissionGranted();
      if (!granted) {
        const permission = await requestPermission();
        granted = permission === 'granted';
      }
      if (!granted) return;

      const bodyMap: Record<string, string> = {
        like: `${notif.actorUsername} liked your post.`,
        comment: `${notif.actorUsername} commented on your post.`,
        follow: `${notif.actorUsername} started following you.`,
        mention: `${notif.actorUsername} mentioned you in a comment.`,
        message: `${notif.actorUsername} sent you a message.`,
      };

      sendNotification({
        title: 'Insta',
        body: bodyMap[notif.type] ?? `${notif.actorUsername} interacted with you.`,
      });
    },
  });

  return null;
}
