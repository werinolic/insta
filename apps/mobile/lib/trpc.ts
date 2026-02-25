import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, splitLink, createWSClient, wsLink } from '@trpc/client';
import type { AppRouter } from '@repo/api';
import * as SecureStore from 'expo-secure-store';

export const trpc = createTRPCReact<AppRouter>();

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
const WS_URL = API_URL.replace(/^http/, 'ws');

let wsClient: ReturnType<typeof createWSClient> | null = null;

function getWsClient() {
  if (!wsClient) {
    wsClient = createWSClient({ url: WS_URL });
  }
  return wsClient;
}

export function makeTRPCClient() {
  return trpc.createClient({
    links: [
      splitLink({
        condition: (op) => op.type === 'subscription',
        true: wsLink({ client: getWsClient() }),
        false: httpBatchLink({
          url: `${API_URL}/trpc`,
          async headers() {
            const token = await SecureStore.getItemAsync('accessToken');
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      }),
    ],
  });
}

/** Call after logout to reset the WS connection */
export function resetWsClient() {
  wsClient?.close();
  wsClient = null;
}
