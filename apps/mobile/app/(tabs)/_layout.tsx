import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore, useUIStore } from '../../lib/store';

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

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);
  const notificationCount = useUIStore((s) => s.notificationCount);

  if (!user) return <Redirect href="/(auth)/login" />;

  return (
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
  );
}
