import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';
import { useAuthStore } from '../../lib/store';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 3) / 3;

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);

  const { data: profile, isLoading } = trpc.users.byUsername.useQuery({ username });
  const posts = trpc.posts.byUsername.useInfiniteQuery(
    { username, limit: 18 },
    { getNextPageParam: (p) => p.nextCursor },
  );

  const follow = trpc.follows.follow.useMutation({ onSuccess: () => trpc.useUtils().users.byUsername.invalidate({ username }) });
  const unfollow = trpc.follows.unfollow.useMutation({ onSuccess: () => trpc.useUtils().users.byUsername.invalidate({ username }) });

  if (isLoading) return <View style={s.center}><ActivityIndicator /></View>;
  if (!profile) return <View style={s.center}><Text>User not found</Text></View>;

  const allPosts = posts.data?.pages.flatMap((p) => p.items) ?? [];
  const isOwn = currentUser?.id === profile.id;

  return (
    <FlatList
      data={allPosts}
      keyExtractor={(item) => item.id}
      numColumns={3}
      columnWrapperStyle={{ gap: 1.5 }}
      ListHeaderComponent={
        <View>
          <View style={s.header}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarPlaceholder]} />
            )}
            <View style={s.stats}>
              <View style={s.statBox}>
                <Text style={s.statVal}>{profile.postCount}</Text>
                <Text style={s.statLabel}>Posts</Text>
              </View>
              <TouchableOpacity style={s.statBox} onPress={() => router.push(`/${username}/followers`)}>
                <Text style={s.statVal}>{profile.followerCount}</Text>
                <Text style={s.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.statBox} onPress={() => router.push(`/${username}/following`)}>
                <Text style={s.statVal}>{profile.followingCount}</Text>
                <Text style={s.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={s.username}>{profile.username}</Text>
          {profile.fullName ? <Text style={s.fullName}>{profile.fullName}</Text> : null}
          {profile.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}

          {!isOwn && (
            <View style={s.actions}>
              {profile.isFollowing ? (
                <TouchableOpacity style={s.followingBtn} onPress={() => unfollow.mutate({ username })}>
                  <Text style={s.followingBtnText}>Following</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={s.followBtn} onPress={() => follow.mutate({ username })}>
                  <Text style={s.followBtnText}>Follow</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={s.divider} />
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => router.push(`/p/${item.id}`)}>
          <Image source={{ uri: item.thumbnailUrl ?? '' }} style={{ width: GRID_SIZE, height: GRID_SIZE }} />
        </TouchableOpacity>
      )}
      onEndReached={() => posts.hasNextPage && posts.fetchNextPage()}
      onEndReachedThreshold={0.3}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  actions: { paddingHorizontal: 16, marginBottom: 12 },
  followBtn: { backgroundColor: '#0095f6', borderRadius: 6, padding: 8, alignItems: 'center' },
  followBtnText: { color: '#fff', fontWeight: '600' },
  followingBtn: { borderWidth: 1, borderColor: '#dbdbdb', borderRadius: 6, padding: 8, alignItems: 'center' },
  followingBtnText: { fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#dbdbdb' },
});
