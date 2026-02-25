'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Navbar } from '@/components/nav/navbar';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { use } from 'react';

interface Props {
  params: Promise<{ username: string }>;
}

export default function FollowingPage({ params }: Props) {
  const { username } = use(params);

  return (
    <AuthGuard>
      <Navbar />
      <main className="pt-14">
        <div className="max-w-sm mx-auto px-4 py-6">
          <h1 className="text-base font-semibold mb-4">Following</h1>
          <FollowingList username={username} />
        </div>
      </main>
    </AuthGuard>
  );
}

function FollowingList({ username }: { username: string }) {
  const { data, isLoading } = trpc.users.following.useQuery({ username, limit: 50 });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data?.items.length) {
    return <p className="text-sm text-gray-500 text-center py-8">Not following anyone yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {data.items.map((u) => (
        <li key={u.id}>
          <Link href={`/${u.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {u.avatarUrl ? (
              <img src={u.avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-500">
                {u.username[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{u.username}</p>
              {u.fullName && <p className="text-sm text-gray-500 truncate">{u.fullName}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
