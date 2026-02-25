import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';
import { pickImages, uploadAsset, type UploadResult } from '../../lib/upload';

interface SelectedMedia {
  uri: string;
  uploaded: UploadResult | null;
  uploading: boolean;
}

export default function NewPostScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [media, setMedia] = useState<SelectedMedia[]>([]);
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const createPost = trpc.posts.create.useMutation({
    onSuccess: () => {
      utils.posts.feed.invalidate();
      setMedia([]);
      setCaption('');
      router.replace('/(tabs)');
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  async function handlePick() {
    const assets = await pickImages();
    if (!assets) return;

    const initial: SelectedMedia[] = assets.map((a) => ({ uri: a.uri, uploaded: null, uploading: true }));
    setMedia(initial);

    const results = await Promise.allSettled(assets.map(uploadAsset));
    setMedia(
      results.map((r: PromiseSettledResult<UploadResult>, i: number) => ({
        uri: assets[i].uri,
        uploaded: r.status === 'fulfilled' ? r.value : null,
        uploading: false,
      })),
    );
  }

  async function handleSubmit() {
    const uploaded = media.filter((m: SelectedMedia) => m.uploaded !== null);
    if (uploaded.length === 0) {
      Alert.alert('Pick at least one photo');
      return;
    }
    if (media.some((m) => m.uploading)) {
      Alert.alert('Uploads still in progress, please wait');
      return;
    }

    setSubmitting(true);
    createPost.mutate({
      caption: caption.trim() || undefined,
      media: uploaded.map((m: SelectedMedia, i: number) => ({
        key: m.uploaded!.key,
        url: m.uploaded!.url,
        thumbnailUrl: m.uploaded!.thumbnailUrl,
        mediumUrl: m.uploaded!.mediumUrl,
        width: m.uploaded!.width,
        height: m.uploaded!.height,
        order: i,
      })),
    });
    setSubmitting(false);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>New Post</Text>

      {media.length === 0 ? (
        <TouchableOpacity style={styles.picker} onPress={handlePick}>
          <Text style={styles.pickerText}>📷 Choose photos</Text>
        </TouchableOpacity>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
            {media.map((m, i) => (
              <View key={i} style={styles.thumbWrap}>
                <Image source={{ uri: m.uri }} style={styles.thumb} />
                {m.uploading && (
                  <View style={styles.overlay}>
                    <Text style={styles.overlayText}>↑</Text>
                  </View>
                )}
                {!m.uploading && !m.uploaded && (
                  <View style={[styles.overlay, { backgroundColor: 'rgba(255,0,0,0.5)' }]}>
                    <Text style={styles.overlayText}>✗</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={handlePick} style={styles.changeBtn}>
            <Text style={styles.changeBtnText}>Change photos</Text>
          </TouchableOpacity>
        </>
      )}

      <TextInput
        style={styles.captionInput}
        placeholder="Write a caption…"
        multiline
        maxLength={2200}
        value={caption}
        onChangeText={setCaption}
      />

      <TouchableOpacity
        style={[styles.button, (media.length === 0 || submitting) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={media.length === 0 || submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Posting…' : 'Share'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  picker: { height: 200, borderWidth: 2, borderStyle: 'dashed', borderColor: '#ddd', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  pickerText: { fontSize: 16, color: '#888' },
  strip: { marginBottom: 12 },
  thumbWrap: { marginRight: 8, position: 'relative' },
  thumb: { width: 100, height: 100, borderRadius: 6 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  overlayText: { color: '#fff', fontSize: 22 },
  changeBtn: { marginBottom: 16 },
  changeBtnText: { color: '#0095f6', fontSize: 14 },
  captionInput: { borderWidth: 1, borderColor: '#dbdbdb', borderRadius: 6, padding: 12, minHeight: 80, textAlignVertical: 'top', fontSize: 15, marginBottom: 20 },
  button: { backgroundColor: '#0095f6', borderRadius: 6, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
