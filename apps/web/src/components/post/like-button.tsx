'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';

interface LikeButtonProps {
  postId: string;
  likedByViewer: boolean;
  likeCount: number;
}

export function LikeButton({ postId, likedByViewer: initialLiked, likeCount: initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const utils = trpc.useUtils();

  const toggle = trpc.likes.toggle.useMutation({
    onMutate: () => {
      const wasLiked = liked;
      setLiked((l) => !l);
      setCount((c) => (wasLiked ? c - 1 : c + 1));
    },
    onError: () => {
      setLiked(initialLiked);
      setCount(initialCount);
    },
    onSettled: () => {
      utils.posts.feed.invalidate();
      utils.posts.byId.invalidate({ postId });
    },
  });

  return (
    <button
      onClick={() => toggle.mutate({ postId })}
      className="flex items-center gap-1.5 text-sm font-medium"
      aria-label={liked ? 'Unlike' : 'Like'}
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
