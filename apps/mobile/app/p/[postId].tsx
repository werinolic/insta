import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';
import { useAuthStore } from '../../lib/store';
import { MediaCarousel } from '../../components/MediaCarousel';
import { MentionText } from '../../components/MentionText';

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const utils = trpc.useUtils();
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState<boolean | null>(null);
  const [likeCount, setLikeCount] = useState<number | null>(null);

  const { data: post, isLoading } = trpc.posts.byId.useQuery({ postId });
  const { data: commentsData } = trpc.comments.list.useQuery({ postId, limit: 30 });

  const toggleLike = trpc.likes.toggle.useMutation({
    onMutate: () => {
      const cur = liked ?? post?.likedByViewer;
      const cur_count = likeCount ?? post?.likeCount ?? 0;
      setLiked(!cur);
      setLikeCount(cur ? cur_count - 1 : cur_count + 1);
    },
    onError: () => { setLiked(null); setLikeCount(null); },
    onSettled: () => utils.posts.byId.invalidate({ postId }),
  });

  const addComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      setCommentText('');
      utils.comments.list.invalidate({ postId });
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const deleteComment = trpc.comments.delete.useMutation({
    onSuccess: () => utils.comments.list.invalidate({ postId }),
  });

  if (isLoading) return <View style={s.center}><ActivityIndicator /></View>;
  if (!post) return <View style={s.center}><Text>Post not found</Text></View>;

  const isLiked = liked ?? post.likedByViewer;
  const count = likeCount ?? post.likeCount;
  const comments = commentsData?.items ?? [];

  return (
    <ScrollView style={s.root}>
      {/* Author */}
      <TouchableOpacity style={s.authorRow} onPress={() => router.push(`/${post.username}`)}>
        {post.avatarUrl ? (
          <Image source={{ uri: post.avatarUrl }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarPlaceholder]} />
        )}
        <Text style={s.username}>{post.username}</Text>
      </TouchableOpacity>

      {post.media.length > 0 && <MediaCarousel media={post.media} />}

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity onPress={() => toggleLike.mutate({ postId })}>
          <Text style={s.icon}>{isLiked ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => { if (count > 0) router.push(`/likes/${postId}`); }}>
        <Text style={s.likeCount}>{count} {count === 1 ? 'like' : 'likes'}</Text>
      </TouchableOpacity>

      {post.caption ? (
        <View style={s.captionRow}>
          <Text style={s.captionUsername}>{post.username} </Text>
          <MentionText text={post.caption} style={s.caption} />
        </View>
      ) : null}

      {/* Comments */}
      {comments.map((c) => (
        <View key={c.id} style={s.commentRow}>
          <Text style={s.commentUsername}>{c.username} </Text>
          <MentionText text={c.text} style={s.commentText} />
          {(currentUser?.id === c.userId || currentUser?.id === post.userId) && (
            <TouchableOpacity onPress={() => deleteComment.mutate({ commentId: c.id })}>
              <Text style={s.deleteText}> ✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Add comment */}
      <View style={s.commentInputRow}>
        <TextInput
          style={s.commentInput}
          placeholder="Add a comment…"
          value={commentText}
          onChangeText={setCommentText}
          onSubmitEditing={() => {
            if (commentText.trim()) addComment.mutate({ postId, text: commentText.trim() });
          }}
          returnKeyType="send"
        />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  authorRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  avatar: { width: 34, height: 34, borderRadius: 17, marginRight: 10 },
  avatarPlaceholder: { backgroundColor: '#ddd' },
  username: { fontWeight: '600', fontSize: 14 },
  actions: { flexDirection: 'row', padding: 12, gap: 12 },
  icon: { fontSize: 26 },
  likeCount: { fontWeight: '600', paddingHorizontal: 12, marginBottom: 4 },
  captionRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 8 },
  captionUsername: { fontWeight: '600', fontSize: 14 },
  caption: { fontSize: 14, flexShrink: 1 },
  commentRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingVertical: 4 },
  commentUsername: { fontWeight: '600', fontSize: 14 },
  commentText: { fontSize: 14, flexShrink: 1 },
  deleteText: { color: '#e44', fontSize: 12 },
  commentInputRow: { padding: 12 },
  commentInput: { borderBottomWidth: 1, borderColor: '#dbdbdb', paddingVertical: 6, fontSize: 14 },
});
