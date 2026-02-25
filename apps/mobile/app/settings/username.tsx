import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';
import { useAuthStore } from '../../lib/store';

export default function ChangeUsernameScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username ?? '');

  const change = trpc.auth.changeUsername.useMutation({
    onSuccess: (updated) => {
      setUser(updated as Parameters<typeof setUser>[0]);
      Alert.alert('Username changed');
      router.back();
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.root}>
      <Text style={s.note}>You can change your username once every 14 days.</Text>
      <TextInput
        style={s.input}
        placeholder="New username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TouchableOpacity
        style={s.button}
        onPress={() => change.mutate({ username })}
        disabled={change.isPending}
      >
        <Text style={s.buttonText}>{change.isPending ? 'Saving…' : 'Save'}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 30 },
  note: { color: '#888', fontSize: 13, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#dbdbdb', borderRadius: 6, padding: 12, fontSize: 15, marginBottom: 12 },
  button: { backgroundColor: '#0095f6', borderRadius: 6, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
