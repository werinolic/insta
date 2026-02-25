import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '../../lib/trpc';
import { PostCard, type FeedPost } from '../../components/PostCard';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.posts.feed.useInfiniteQuery(
      { limit: 10 },
      { getNextPageParam: (page) => page.nextCursor },
    );

  const posts: FeedPost[] = data?.pages.flatMap((p) => p.items as FeedPost[]) ?? [];

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <PostCard post={item} />}
      contentContainerStyle={{ paddingTop: insets.top }}
      onEndReached={() => hasNextPage && fetchNextPage()}
      onEndReachedThreshold={0.3}
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={styles.footer} /> : null}
      ListEmptyComponent={<Text style={styles.empty}>No posts yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  footer: { padding: 16 },
  empty: { textAlign: 'center', marginTop: 80, color: '#888' },
});
