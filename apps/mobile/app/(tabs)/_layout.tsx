import { useEffect } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore, useUIStore } from '../../lib/store';
import { trpc } from '../../lib/trpc';

function TabIcon({ label, badge }: { label: string; badge?: number }) {
  return (
    <Text style={{ fontSize: 22 }}>
      {label}
      {badge ? (
        <Text style={{ fontSize: 10, color: 'red' }}> {badge > 9 ? '9+' : badge}</Text>
      ) : null}
    </Text>
  );
}

function NotificationBadgeSync() {
  const { setNotificationCount, notificationCount } = useUIStore();

  // Seed initial count from DB on mount
  const { data } = trpc.notifications.unreadCount.useQuery(undefined, {
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data !== undefined) {
      setNotificationCount(data.count);
    }
  }, [data?.count]);

  // Live badge increment via WS subscription
  trpc.notifications.subscribe.useSubscription(undefined, {
    onData: () => {
      setNotificationCount(notificationCount + 1);
    },
  });

  return null;
}

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);
  const notificationCount = useUIStore((s) => s.notificationCount);

  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <>
      <NotificationBadgeSync />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#000',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ tabBarIcon: () => <TabIcon label="🏠" /> }}
        />
        <Tabs.Screen
          name="search"
          options={{ tabBarIcon: () => <TabIcon label="🔍" /> }}
        />
        <Tabs.Screen
          name="new"
          options={{ tabBarIcon: () => <TabIcon label="➕" /> }}
        />
        <Tabs.Screen
          name="notifications"
          options={{ tabBarIcon: () => <TabIcon label="🤍" badge={notificationCount} /> }}
        />
        <Tabs.Screen
          name="profile"
          options={{ tabBarIcon: () => <TabIcon label="👤" /> }}
        />
      </Tabs>
    </>
  );
}
