import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { trpc } from '../../lib/trpc';
import { useAuthStore } from '../../lib/store';
import { uploadAvatar } from '../../lib/upload';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [uploading, setUploading] = useState(false);

  const update = trpc.auth.updateProfile.useMutation({
    onSuccess: (updated) => {
      setUser(updated as Parameters<typeof setUser>[0]);
      Alert.alert('Saved');
      router.back();
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  async function handlePickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const uploaded = await uploadAvatar(asset.uri, asset.mimeType ?? 'image/jpeg');
      setAvatarUrl(uploaded.url);
    } catch {
      Alert.alert('Upload failed', 'Could not upload avatar.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.root}>
      {/* Avatar */}
      <TouchableOpacity style={s.avatarWrap} onPress={handlePickAvatar} disabled={uploading}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarPlaceholder]} />
        )}
        <Text style={s.changePhoto}>{uploading ? 'Uploading…' : 'Change photo'}</Text>
      </TouchableOpacity>

      <Text style={s.label}>Full name</Text>
      <TextInput style={s.input} value={fullName} onChangeText={setFullName} />
      <Text style={s.label}>Bio</Text>
      <TextInput style={[s.input, s.multiline]} value={bio} onChangeText={setBio} multiline maxLength={150} />

      <TouchableOpacity
        style={[s.button, (update.isPending || uploading) && s.buttonDisabled]}
        onPress={() => update.mutate({ fullName: fullName || undefined, bio: bio || undefined, avatarUrl: avatarUrl || undefined })}
        disabled={update.isPending || uploading}
      >
        <Text style={s.buttonText}>{update.isPending ? 'Saving…' : 'Save'}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', padding: 20 },
  avatarWrap: { alignItems: 'center', marginBottom: 20, marginTop: 8 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 8 },
  avatarPlaceholder: { backgroundColor: '#ddd' },
  changePhoto: { color: '#0095f6', fontWeight: '600', fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 16, color: '#888' },
  input: { borderWidth: 1, borderColor: '#dbdbdb', borderRadius: 6, padding: 12, fontSize: 15 },
  multiline: { height: 80, textAlignVertical: 'top' },
  button: { marginTop: 28, backgroundColor: '#0095f6', borderRadius: 6, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
