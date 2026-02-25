import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';

export default function FollowingScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();

  const { data, isLoading } = trpc.users.following.useQuery({ username, limit: 50 });

  if (isLoading) {
    return <View style={s.center}><ActivityIndicator /></View>;
  }

  const items = data?.items ?? [];

  return (
    <FlatList
      data={items}
      keyExtractor={(u) => u.id}
      contentContainerStyle={s.list}
      ListHeaderComponent={<Text style={s.title}>Following</Text>}
      ListEmptyComponent={<Text style={s.empty}>Not following anyone yet.</Text>}
      renderItem={({ item: u }) => (
        <TouchableOpacity style={s.row} onPress={() => router.push(`/${u.username}`)}>
          {u.avatarUrl ? (
            <Image source={{ uri: u.avatarUrl }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarPlaceholder]}>
              <Text style={s.avatarInitial}>{u.username[0].toUpperCase()}</Text>
            </View>
          )}
          <View style={s.info}>
            <Text style={s.username}>{u.username}</Text>
            {u.fullName ? <Text style={s.fullName}>{u.fullName}</Text> : null}
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingTop: 60 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  empty: { color: '#888', textAlign: 'center', paddingTop: 32 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatarPlaceholder: { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontWeight: '700', fontSize: 18, color: '#888' },
  info: { flex: 1 },
  username: { fontWeight: '600', fontSize: 14 },
  fullName: { fontSize: 13, color: '#888' },
});
