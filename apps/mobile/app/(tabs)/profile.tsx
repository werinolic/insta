import { ActivityIndicator, Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';
import { useAuthStore } from '../../lib/store';
import { resetWsClient } from '../../lib/trpc';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 3) / 3;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const utils = trpc.useUtils();

  const profile = trpc.users.byUsername.useQuery(
    { username: user?.username ?? '' },
    { enabled: !!user?.username },
  );

  const posts = trpc.posts.byUsername.useInfiniteQuery(
    { username: user?.username ?? '', limit: 18 },
    { getNextPageParam: (p) => p.nextCursor, enabled: !!user?.username },
  );

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      resetWsClient();
      clearAuth();
      utils.invalidate();
    },
  });

  if (!user || profile.isLoading) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  const allPosts = posts.data?.pages.flatMap((p) => p.items) ?? [];
  const p = profile.data;

  return (
    <FlatList
      data={allPosts}
      keyExtractor={(item) => item.id}
      numColumns={3}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            {p?.avatarUrl ? (
              <Image source={{ uri: p.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
            <View style={styles.stats}>
              {[
                { label: 'Posts', val: p?.postCount ?? 0 },
                { label: 'Followers', val: p?.followerCount ?? 0 },
                { label: 'Following', val: p?.followingCount ?? 0 },
              ].map(({ label, val }) => (
                <View key={label} style={styles.statBox}>
                  <Text style={styles.statVal}>{val}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.username}>{p?.username}</Text>
          {p?.fullName ? <Text style={styles.fullName}>{p.fullName}</Text> : null}
          {p?.bio ? <Text style={styles.bio}>{p.bio}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/settings/profile')}>
              <Text style={styles.editBtnText}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => logout.mutate()}>
              <Text style={styles.logoutBtnText}>Log out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => router.push(`/p/${item.id}`)}>
          <Image
            source={{ uri: item.thumbnailUrl ?? '' }}
            style={styles.gridThumb}
          />
        </TouchableOpacity>
      )}
      onEndReached={() => posts.hasNextPage && posts.fetchNextPage()}
      onEndReachedThreshold={0.3}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 20 },
  avatarPlaceholder: { backgroundColor: '#ddd' },
  stats: { flexDirection: 'row', flex: 1, justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#888' },
  username: { fontWeight: '700', fontSize: 15, paddingHorizontal: 16, marginBottom: 2 },
  fullName: { fontSize: 14, paddingHorizontal: 16, marginBottom: 2 },
  bio: { fontSize: 14, paddingHorizontal: 16, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  editBtn: { flex: 1, borderWidth: 1, borderColor: '#dbdbdb', borderRadius: 6, padding: 8, alignItems: 'center' },
  editBtnText: { fontWeight: '600', fontSize: 14 },
  logoutBtn: { flex: 1, borderWidth: 1, borderColor: '#dbdbdb', borderRadius: 6, padding: 8, alignItems: 'center' },
  logoutBtnText: { fontWeight: '600', fontSize: 14, color: '#e44' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#dbdbdb', marginVertical: 4 },
  row: { gap: 1.5 },
  gridThumb: { width: GRID_SIZE, height: GRID_SIZE },
});
