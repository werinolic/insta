import { useState } from 'react';
import { trpc } from '@/lib/trpc';

interface LikeButtonProps {
  postId: string;
  likedByViewer: boolean;
  likeCount: number;
}

export function LikeButton({ postId, likedByViewer, likeCount }: LikeButtonProps) {
  const [optimistic, setOptimistic] = useState<{ liked: boolean; count: number } | null>(null);
  const utils = trpc.useUtils();

  const toggle = trpc.likes.toggle.useMutation({
    onMutate: () => {
      const newLiked = !( optimistic?.liked ?? likedByViewer);
      setOptimistic({ liked: newLiked, count: (optimistic?.count ?? likeCount) + (newLiked ? 1 : -1) });
    },
    onSettled: () => {
      setOptimistic(null);
      utils.posts.feed.invalidate();
      utils.posts.byId.invalidate({ postId });
    },
  });

  const liked = optimistic?.liked ?? likedByViewer;
  const count = optimistic?.count ?? likeCount;

  return (
    <button
      onClick={() => toggle.mutate({ postId })}
      className="flex items-center gap-1.5 text-sm font-medium"
    >
      <svg
        className={`w-6 h-6 transition-colors ${liked ? 'fill-red-500 stroke-red-500' : 'fill-none stroke-current'}`}
        viewBox="0 0 24 24"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{count}</span>
    </button>
  );
}

export function LikeButtonLive({ postId, likedByViewer, likeCount }: LikeButtonProps) {
  const [localCount, setLocalCount] = useState(likeCount);
  const [localLiked, setLocalLiked] = useState(likedByViewer);

  // Real-time count via WS subscription
  trpc.likes.subscribeCount.useSubscription(
    { postId },
    { onData: (data: { likeCount: number }) => setLocalCount(data.likeCount) },
  );

  const toggle = trpc.likes.toggle.useMutation({
    onMutate: () => {
      const newLiked = !localLiked;
      setLocalLiked(newLiked);
      setLocalCount((c) => c + (newLiked ? 1 : -1));
    },
  });

  return (
    <button
      onClick={() => toggle.mutate({ postId })}
      className="flex items-center gap-1.5 text-sm font-medium"
    >
      <svg
        className={`w-6 h-6 transition-colors ${localLiked ? 'fill-red-500 stroke-red-500' : 'fill-none stroke-current'}`}
        viewBox="0 0 24 24"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{localCount}</span>
    </button>
  );
}
