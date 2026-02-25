import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { trpc, resetWsClient } from '../../lib/trpc';
import { useAuthStore } from '../../lib/store';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const utils = trpc.useUtils();
  const [password, setPassword] = useState('');

  const del = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      resetWsClient();
      clearAuth();
      utils.invalidate();
      router.replace('/(auth)/login');
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  function confirm() {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and all your posts. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => del.mutate({ password }),
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.root}>
      <Text style={s.warning}>
        Permanently deletes your account and all your posts. This cannot be undone.
      </Text>
      <TextInput
        style={s.input}
        placeholder="Confirm your password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity
        style={[s.button, !password && s.buttonDisabled]}
        onPress={confirm}
        disabled={!password || del.isPending}
      >
        <Text style={s.buttonText}>{del.isPending ? 'Deleting…' : 'Delete my account'}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 30 },
  warning: { color: '#888', fontSize: 14, marginBottom: 20, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: '#dbdbdb', borderRadius: 6, padding: 12, fontSize: 15, marginBottom: 16 },
  button: { backgroundColor: '#e44', borderRadius: 6, padding: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
