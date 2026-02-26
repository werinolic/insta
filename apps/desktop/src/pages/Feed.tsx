import { useEffect, useRef } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { PostCard } from '@/components/post/PostCard';
import { Spinner } from '@/components/ui/Spinner';
import { trpc } from '@/lib/trpc';

function FeedContent() {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.posts.feed.useInfiniteQuery(
      { limit: 10 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
    );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
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

export default function FeedPage() {
  return (
    <AuthGuard>
      <div className="scrollable h-full">
        <div className="max-w-lg mx-auto px-4 py-6">
          <FeedContent />
        </div>
      </div>
    </AuthGuard>
  );
}
