import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';

export default function LikedByScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();

  const { data, isLoading } = trpc.likes.likedBy.useQuery({ postId, limit: 50 });

  const users = data?.items ?? [];

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      style={s.root}
      data={users}
      keyExtractor={(u) => u.id}
      ListEmptyComponent={
        <Text style={s.empty}>No likes yet.</Text>
      }
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
  root: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#888', marginTop: 60, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 12 },
  avatarPlaceholder: { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontWeight: '700', fontSize: 18, color: '#555' },
  info: { flex: 1 },
  username: { fontWeight: '600', fontSize: 14 },
  fullName: { color: '#888', fontSize: 13, marginTop: 1 },
});
