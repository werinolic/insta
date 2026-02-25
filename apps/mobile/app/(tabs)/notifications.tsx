import { useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { trpc } from '../../lib/trpc';
import { useUIStore } from '../../lib/store';

export default function NotificationsScreen() {
  const utils = trpc.useUtils();
  const setNotificationCount = useUIStore((s) => s.setNotificationCount);

  const { data, isLoading } = trpc.notifications.list.useQuery({ limit: 30 });
  const markAllRead = trpc.notifications.markAllRead.useMutation();

  useEffect(() => {
    if (data) {
      markAllRead.mutate(undefined, {
        onSuccess: () => {
          setNotificationCount(0);
          utils.notifications.unreadCount.invalidate();
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!data]);

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  const items = data?.items ?? [];

  return (
    <FlatList
      data={items}
      keyExtractor={(n) => n.id}
      contentContainerStyle={styles.list}
      renderItem={({ item: n }) => (
        <View style={styles.row}>
          <Text style={styles.actor}>{n.actorUsername} </Text>
          <Text style={styles.text}>
            {n.type === 'like' && 'liked your post.'}
            {n.type === 'comment' && 'commented on your post.'}
            {n.type === 'follow' && 'started following you.'}
            {n.type === 'mention' && 'mentioned you in a comment.'}
          </Text>
        </View>
      )}
      ListHeaderComponent={<Text style={styles.header}>Notifications</Text>}
      ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingTop: 60, paddingHorizontal: 16 },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  actor: { fontWeight: '600', fontSize: 14 },
  text: { fontSize: 14, color: '#333', flexShrink: 1 },
  empty: { textAlign: 'center', marginTop: 60, color: '#888' },
});
