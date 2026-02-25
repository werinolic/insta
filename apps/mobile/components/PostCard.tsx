import { useState } from 'react';
import { Alert, Dimensions, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { trpc } from '../lib/trpc';
import { useAuthStore } from '../lib/store';

export interface FeedPost {
  id: string;
  caption: string | null;
  createdAt: string;
  userId: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  likeCount: number;
  likedByViewer: boolean;
  media: { id: string; url: string; mediumUrl: string | null; thumbnailUrl: string | null; order: number }[];
}

const { width } = Dimensions.get('window');

export function PostCard({ post, onDelete }: { post: FeedPost; onDelete?: () => void }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const utils = trpc.useUtils();
  const [commentText, setCommentText] = useState('');
  const [optimisticLike, setOptimisticLike] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);

  const liked = optimisticLike ?? post.likedByViewer;
  const likeCount = optimisticCount ?? post.likeCount;

  const toggleLike = trpc.likes.toggle.useMutation({
    onMutate: () => {
      setOptimisticLike(!liked);
      setOptimisticCount(liked ? likeCount - 1 : likeCount + 1);
    },
    onError: () => {
      setOptimisticLike(null);
      setOptimisticCount(null);
    },
    onSettled: () => utils.posts.feed.invalidate(),
  });

  const addComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      setCommentText('');
      utils.comments.list.invalidate({ postId: post.id });
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const deletePost = trpc.posts.delete.useMutation({
    onSuccess: () => onDelete?.(),
    onError: (err) => Alert.alert('Error', err.message),
  });

  const imageUrl = post.media[0]?.mediumUrl ?? post.media[0]?.url;
  const isOwner = user?.id === post.userId;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userRow} onPress={() => router.push(`/${post.username}`)}>
          {post.avatarUrl ? (
            <Image source={{ uri: post.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )}
          <Text style={styles.username}>{post.username}</Text>
        </TouchableOpacity>

        {isOwner && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Delete post?', undefined, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deletePost.mutate({ postId: post.id }),
                },
              ])
            }
          >
            <Text style={styles.dots}>⋯</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Image */}
      {imageUrl ? (
        <TouchableOpacity onPress={() => router.push(`/p/${post.id}`)}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        </TouchableOpacity>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => toggleLike.mutate({ postId: post.id })}>
          <Text style={styles.heartIcon}>{liked ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/p/${post.id}`)}>
          <Text style={styles.actionIcon}>💬</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.likeCount}>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</Text>

      {post.caption ? (
        <View style={styles.captionRow}>
          <Text style={styles.captionUsername}>{post.username} </Text>
          <Text style={styles.caption}>{post.caption}</Text>
        </View>
      ) : null}

      {/* Inline comment input */}
      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment…"
          value={commentText}
          onChangeText={setCommentText}
          onSubmitEditing={() => {
            if (commentText.trim()) {
              addComment.mutate({ postId: post.id, text: commentText.trim() });
            }
          }}
          returnKeyType="send"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 8, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 34, height: 34, borderRadius: 17, marginRight: 10 },
  avatarPlaceholder: { backgroundColor: '#ddd' },
  username: { fontWeight: '600', fontSize: 14 },
  dots: { fontSize: 22, paddingHorizontal: 8 },
  image: { width, height: width },
  actions: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 12 },
  heartIcon: { fontSize: 26 },
  actionIcon: { fontSize: 26 },
  likeCount: { fontWeight: '600', paddingHorizontal: 12, marginBottom: 4 },
  captionRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 4 },
  captionUsername: { fontWeight: '600', fontSize: 14 },
  caption: { fontSize: 14, flexShrink: 1 },
  commentInputRow: { paddingHorizontal: 12, paddingBottom: 12 },
  commentInput: { borderBottomWidth: 1, borderColor: '#dbdbdb', paddingVertical: 6, fontSize: 14, color: '#333' },
});
