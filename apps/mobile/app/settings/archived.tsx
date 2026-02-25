import { Alert, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 3) / 3;

export default function ArchivedPostsScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data, isLoading, fetchNextPage, hasNextPage } = trpc.posts.archived.useInfiniteQuery(
    { limit: 12 },
    { getNextPageParam: (p) => p.nextCursor },
  );

  const archiveMutation = trpc.posts.archive.useMutation({
    onSuccess: () => utils.posts.archived.invalidate(),
    onError: (err) => Alert.alert('Error', err.message),
  });

  const deleteMutation = trpc.posts.delete.useMutation({
    onSuccess: () => utils.posts.archived.invalidate(),
    onError: (err) => Alert.alert('Error', err.message),
  });

  const allPosts = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <View style={s.center}>
        <Text style={s.empty}>Loading…</Text>
      </View>
    );
  }

  if (allPosts.length === 0) {
    return (
      <View style={s.center}>
        <Text style={s.empty}>No archived posts.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={allPosts}
      keyExtractor={(item) => item.id}
      numColumns={3}
      columnWrapperStyle={{ gap: 1.5 }}
      contentContainerStyle={s.list}
      ListHeaderComponent={<Text style={s.title}>Archived Posts</Text>}
      onEndReached={() => hasNextPage && fetchNextPage()}
      onEndReachedThreshold={0.3}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              'Options',
              item.caption ? `"${item.caption.slice(0, 60)}"` : 'No caption',
              [
                {
                  text: 'Unarchive',
                  onPress: () => archiveMutation.mutate({ postId: item.id }),
                },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () =>
                    Alert.alert('Delete post?', 'This cannot be undone.', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => deleteMutation.mutate({ postId: item.id }),
                      },
                    ]),
                },
                { text: 'View', onPress: () => router.push(`/p/${item.id}`) },
                { text: 'Cancel', style: 'cancel' },
              ],
            )
          }
        >
          <Image source={{ uri: item.thumbnailUrl ?? '' }} style={{ width: GRID_SIZE, height: GRID_SIZE }} />
        </TouchableOpacity>
      )}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', paddingHorizontal: 16, marginBottom: 12 },
  empty: { color: '#888', fontSize: 15 },
});
