import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, splitLink, createWSClient, wsLink } from '@trpc/client';
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';
import { secureGet } from '@/lib/secure-store';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const WS_URL = API_URL.replace(/^http/, 'ws');

let _queryClient: QueryClient | undefined;

function getQueryClient() {
  if (!_queryClient) {
    _queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: 30 * 1000, retry: 1 } },
    });
  }
  return _queryClient;
}

let wsClient: ReturnType<typeof createWSClient> | null = null;

function getWsClient() {
  if (!wsClient) wsClient = createWSClient({ url: WS_URL });
  return wsClient;
}

function TRPCProviderInner({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() => {
    const ws = getWsClient();
    return trpc.createClient({
      links: [
        splitLink({
          condition: (op) => op.type === 'subscription',
          true: wsLink({ client: ws }),
          false: httpBatchLink({
            url: `${API_URL}/trpc`,
            headers() {
              const token = useAuthStore.getState().accessToken;
              return token ? { Authorization: `Bearer ${token}` } : {};
            },
          }),
        }),
      ],
    });
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const refresh = trpc.auth.refreshMobile.useMutation();

  useEffect(() => {
    secureGet('sessionId').then((sessionId) => {
      if (!sessionId) {
        clearAuth();
        return;
      }
      refresh.mutate(
        { sessionId },
        {
          onSuccess: ({ accessToken, user }) => setAuth(accessToken, user),
          onError: () => {
            clearAuth();
          },
        },
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProviderInner>
      <AuthBootstrap>{children}</AuthBootstrap>
    </TRPCProviderInner>
  );
}
