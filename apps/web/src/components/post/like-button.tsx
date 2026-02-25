'use client';

import { useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { LikedByModal } from './liked-by-modal';

interface LikeButtonProps {
  postId: string;
  likedByViewer: boolean;
  likeCount: number;
}

/** Like button with a WS subscription for live count updates. Use only on post detail pages. */
export function LikeButtonLive({ postId, likedByViewer: initialLiked, likeCount: initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [showLikedBy, setShowLikedBy] = useState(false);
  const pendingRef = useRef(false);
  const utils = trpc.useUtils();

  trpc.likes.subscribeCount.useSubscription(
    { postId },
    {
      onData: ({ likeCount: liveCount }) => {
        if (!pendingRef.current) setCount(liveCount);
      },
    },
  );

  const toggle = trpc.likes.toggle.useMutation({
    onMutate: () => {
      pendingRef.current = true;
      const wasLiked = liked;
      setLiked((l) => !l);
      setCount((c) => (wasLiked ? c - 1 : c + 1));
    },
    onError: () => {
      setLiked(initialLiked);
      setCount(initialCount);
    },
    onSettled: () => {
      pendingRef.current = false;
      utils.posts.feed.invalidate();
      utils.posts.byId.invalidate({ postId });
    },
  });

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => toggle.mutate({ postId })}
          className="flex items-center text-sm font-medium"
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
        </button>
        <button
          onClick={() => { if (count > 0) setShowLikedBy(true); }}
          className="text-sm font-medium hover:underline"
        >
          {count}
        </button>
      </div>
      {showLikedBy && <LikedByModal postId={postId} onClose={() => setShowLikedBy(false)} />}
    </>
  );
}

export function LikeButton({ postId, likedByViewer: initialLiked, likeCount: initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [showLikedBy, setShowLikedBy] = useState(false);
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
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => toggle.mutate({ postId })}
          className="flex items-center text-sm font-medium"
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
        </button>
        <button
          onClick={() => { if (count > 0) setShowLikedBy(true); }}
          className="text-sm font-medium hover:underline"
        >
          {count}
        </button>
      </div>
      {showLikedBy && <LikedByModal postId={postId} onClose={() => setShowLikedBy(false)} />}
    </>
  );
}
