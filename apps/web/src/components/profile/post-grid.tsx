'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { Spinner } from '@/components/ui/spinner';

export function PostGrid({ username }: { username: string }) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.posts.byUsername.useInfiniteQuery(
      { username, limit: 12 },
      { getNextPageParam: (p) => p.nextCursor ?? undefined },
    );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm">No posts yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/p/${post.id}`}
            className="aspect-square block relative bg-black group overflow-hidden"
          >
            {post.thumbnailUrl ? (
              <img
                src={post.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </Link>
        ))}
      </div>
      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && <Spinner size="sm" />}
      </div>
    </>
  );
}
