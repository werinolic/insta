'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Spinner } from '@/components/ui/spinner';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  // Wait for auth bootstrap to complete (token could still be loading)
  // We rely on providers.tsx AuthBootstrap which runs on mount
  // If no token after hydration, redirect
  useEffect(() => {
    // Small delay to let AuthBootstrap finish
    const t = setTimeout(() => {
      if (!token) router.replace('/login');
    }, 500);
    return () => clearTimeout(t);
  }, [token, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
