import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthGuard } from '@/components/AuthGuard';
import { Spinner } from '@/components/ui/Spinner';
import { trpc } from '@/lib/trpc';

function ExploreGrid() {
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.posts.explore.useInfiniteQuery(
      { limit: 24 },
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
        <p className="text-lg font-medium">Nothing to explore yet</p>
        <p className="text-sm mt-1">Be the first to post something.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => navigate(`/p/${post.id}`)}
            className="relative aspect-square bg-gray-100 overflow-hidden group"
          >
            {post.thumbnailUrl ? (
              <img
                src={post.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
              <span className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                ♥ {post.likeCount}
              </span>
            </div>
          </button>
        ))}
      </div>
      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && <Spinner size="sm" />}
      </div>
    </>
  );
}

export default function ExplorePage() {
  return (
    <AuthGuard>
      <div className="scrollable h-full">
        <div className="max-w-2xl mx-auto">
          <div className="px-4 py-4 border-b border-gray-200">
            <h1 className="text-lg font-semibold">Explore</h1>
          </div>
          <ExploreGrid />
        </div>
      </div>
    </AuthGuard>
  );
}
