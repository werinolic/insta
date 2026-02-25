import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';
import { useAuthStore } from '../../lib/store';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');

  const update = trpc.auth.updateProfile.useMutation({
    onSuccess: (updated) => {
      setUser(updated as Parameters<typeof setUser>[0]);
      Alert.alert('Saved');
      router.back();
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.root}>
      <Text style={s.label}>Full name</Text>
      <TextInput style={s.input} value={fullName} onChangeText={setFullName} />
      <Text style={s.label}>Bio</Text>
      <TextInput style={[s.input, s.multiline]} value={bio} onChangeText={setBio} multiline maxLength={150} />
      <TouchableOpacity
        style={s.button}
        onPress={() => update.mutate({ fullName: fullName || undefined, bio: bio || undefined })}
        disabled={update.isPending}
      >
        <Text style={s.buttonText}>{update.isPending ? 'Saving…' : 'Save'}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', padding: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 16, color: '#888' },
  input: { borderWidth: 1, borderColor: '#dbdbdb', borderRadius: 6, padding: 12, fontSize: 15 },
  multiline: { height: 80, textAlignVertical: 'top' },
  button: { marginTop: 28, backgroundColor: '#0095f6', borderRadius: 6, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
