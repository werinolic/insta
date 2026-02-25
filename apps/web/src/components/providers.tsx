'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, splitLink, createWSClient, wsLink } from '@trpc/client';
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 30 * 1000, retry: 1 } },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const WS_URL = API_URL.replace(/^http/, 'ws');

let wsClient: ReturnType<typeof createWSClient> | null = null;

function getWsClient() {
  if (typeof window === 'undefined') return null;
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
          true: ws ? wsLink({ client: ws }) : httpBatchLink({ url: `${API_URL}/trpc` }),
          false: httpBatchLink({
            url: `${API_URL}/trpc`,
            headers() {
              const token = useAuthStore.getState().accessToken;
              return token ? { Authorization: `Bearer ${token}` } : {};
            },
            fetch(url, opts) {
              return fetch(url as string, { ...opts, credentials: 'include' });
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
  const refresh = trpc.auth.refresh.useMutation();

  useEffect(() => {
    refresh.mutate(undefined, {
      onSuccess: ({ accessToken, user }) => setAuth(accessToken, user),
      onError: () => clearAuth(),
    });
    // Run once on mount
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
