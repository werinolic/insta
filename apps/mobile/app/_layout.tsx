import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Providers } from '../components/Providers';
import { trpc } from '../lib/trpc';
import { useAuthStore } from '../lib/store';

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth } = useAuthStore();
  const refresh = trpc.auth.refreshMobile.useMutation();

  useEffect(() => {
    (async () => {
      const sessionId = await SecureStore.getItemAsync('sessionId');
      if (!sessionId) {
        clearAuth();
        return;
      }
      refresh.mutate(
        { sessionId },
        {
          onSuccess: ({ accessToken, user }) => setAuth(accessToken, sessionId, user as Parameters<typeof setAuth>[2]),
          onError: () => clearAuth(),
        },
      );
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Providers>
        <AuthBootstrap>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="[username]/index" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="p/[postId]" options={{ headerShown: true, title: 'Post' }} />
            <Stack.Screen name="messages/[conversationId]" options={{ headerShown: true, title: 'Chat' }} />
            <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
          </Stack>
        </AuthBootstrap>
      </Providers>
    </GestureHandlerRootView>
  );
}
