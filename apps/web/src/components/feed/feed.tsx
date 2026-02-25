'use client';

import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { PostCard } from '@/components/post/post-card';
import { Spinner } from '@/components/ui/spinner';

export function Feed() {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.posts.feed.useInfiniteQuery(
      { limit: 10 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
    );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium">No posts yet</p>
        <p className="text-sm mt-1">Follow people to see their posts here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && <Spinner size="sm" />}
      </div>
    </div>
  );
}
