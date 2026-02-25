'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Navbar } from '@/components/nav/navbar';
import { Spinner } from '@/components/ui/spinner';

function SearchResults({ query }: { query: string }) {
  const { data, isLoading } = trpc.users.search.useQuery(
    { query },
    { enabled: query.length > 0 },
  );

  if (!query) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="sm" />
      </div>
    );
  }

  const results = data ?? [];

  if (results.length === 0) {
    return <p className="text-center text-gray-500 text-sm py-8">No users found for "{query}".</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {results.map((u) => (
        <Link
          key={u.id}
          href={`/${u.username}`}
          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
        >
          {u.avatarUrl ? (
            <img src={u.avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-base font-semibold text-gray-500 flex-shrink-0">
              {u.username[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{u.username}</p>
            {u.fullName && <p className="text-xs text-gray-500 truncate">{u.fullName}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}

function SearchContent() {
  const [query, setQuery] = useState('');

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-lg font-semibold mb-4">Search</h1>
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users…"
          autoFocus
          className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <SearchResults query={query} />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <AuthGuard>
      <Navbar />
      <main className="pt-14">
        <SearchContent />
      </main>
    </AuthGuard>
  );
}
