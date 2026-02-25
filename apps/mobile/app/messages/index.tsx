import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';

export default function ConversationsScreen() {
  const router = useRouter();
  const { data, isLoading } = trpc.conversations.list.useQuery();

  if (isLoading) return <View style={s.center}><ActivityIndicator /></View>;

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(c) => c.id}
      contentContainerStyle={s.list}
      ListHeaderComponent={<Text style={s.title}>Messages</Text>}
      ListEmptyComponent={<Text style={s.empty}>No conversations yet.</Text>}
      renderItem={({ item: conv }) => (
        <TouchableOpacity style={s.row} onPress={() => router.push(`/messages/${conv.id}`)}>
          <View style={s.info}>
            <Text style={s.name}>{conv.name ?? conv.id}</Text>
            {conv.lastMessageText ? (
              <Text style={s.lastMsg} numberOfLines={1}>{conv.lastMessageText}</Text>
            ) : null}
          </View>
          {conv.unreadCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{conv.unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingTop: 60, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  info: { flex: 1 },
  name: { fontWeight: '600', fontSize: 15 },
  lastMsg: { color: '#888', fontSize: 13, marginTop: 2 },
  badge: { backgroundColor: '#0095f6', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 60, color: '#888' },
});
