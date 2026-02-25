import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const change = trpc.auth.changePassword.useMutation({
    onSuccess: () => { Alert.alert('Password changed'); router.back(); },
    onError: (err) => Alert.alert('Error', err.message),
  });

  function submit() {
    if (next !== confirm) { Alert.alert('Passwords do not match'); return; }
    change.mutate({ currentPassword: current, newPassword: next });
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.root}>
      {[
        { label: 'Current password', value: current, set: setCurrent },
        { label: 'New password', value: next, set: setNext },
        { label: 'Confirm new password', value: confirm, set: setConfirm },
      ].map(({ label, value, set }) => (
        <TextInput key={label} style={s.input} placeholder={label} secureTextEntry value={value} onChangeText={set} />
      ))}
      <TouchableOpacity style={s.button} onPress={submit} disabled={change.isPending}>
        <Text style={s.buttonText}>{change.isPending ? 'Saving…' : 'Change password'}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 30 },
  input: { borderWidth: 1, borderColor: '#dbdbdb', borderRadius: 6, padding: 12, fontSize: 15, marginBottom: 12 },
  button: { marginTop: 8, backgroundColor: '#0095f6', borderRadius: 6, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
