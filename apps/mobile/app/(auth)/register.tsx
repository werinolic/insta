import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import { trpc } from '../../lib/trpc';
import { useAuthStore } from '../../lib/store';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const { setAuth } = useAuthStore();

  const register = trpc.auth.register.useMutation({
    onSuccess: ({ accessToken, sessionId, user }) => {
      setAuth(accessToken, sessionId, user as Parameters<typeof setAuth>[2]);
    },
    onError: (err) => Alert.alert('Registration failed', err.message),
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={styles.container}>
        <Text style={styles.logo}>Insta</Text>

        <TextInput style={styles.input} placeholder="Full name" value={fullName} onChangeText={setFullName} />
        <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Username" autoCapitalize="none" value={username} onChangeText={setUsername} />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

        <TouchableOpacity
          style={styles.button}
          onPress={() => register.mutate({ email, username, password, fullName: fullName || undefined })}
          disabled={register.isPending}
        >
          <Text style={styles.buttonText}>{register.isPending ? 'Creating account…' : 'Sign up'}</Text>
        </TouchableOpacity>

        <Link href="/(auth)/login" style={styles.link}>
          Already have an account? <Text style={styles.linkBold}>Log in</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 40, fontWeight: '700', textAlign: 'center', marginBottom: 40 },
  input: { borderWidth: 1, borderColor: '#dbdbdb', borderRadius: 6, padding: 12, marginBottom: 12, fontSize: 15 },
  button: { backgroundColor: '#0095f6', borderRadius: 6, padding: 14, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  link: { textAlign: 'center', color: '#333' },
  linkBold: { fontWeight: '600' },
});
