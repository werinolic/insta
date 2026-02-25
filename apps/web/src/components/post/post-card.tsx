'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LikeButton } from './like-button';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';

// Matches the flat shape returned by posts.feed and posts.byId
export interface FeedPost {
  id: string;
  caption: string | null;
  createdAt: Date | string;
  userId: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  likeCount: number;
  likedByViewer: boolean;
  media: {
    id: string;
    url: string;
    mediumUrl: string | null;
    thumbnailUrl: string | null;
    type?: string;
    order: number;
  }[];
}

export function PostCard({ post }: { post: FeedPost }) {
  const [mediaIndex, setMediaIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const user = useAuthStore((s) => s.user);
  const utils = trpc.useUtils();

  const addComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      setCommentText('');
      utils.comments.list.invalidate({ postId: post.id });
    },
  });

  const media = post.media ?? [];
  const currentMedia = media[mediaIndex];

  const timeAgo = (date: Date | string) => {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString();
  };

  return (
    <article className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <Link href={`/${post.username}`} className="flex-shrink-0">
          {post.avatarUrl ? (
            <img src={post.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
              {post.username[0].toUpperCase()}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/${post.username}`} className="text-sm font-semibold hover:underline">
            {post.username}
          </Link>
          {post.fullName && <p className="text-xs text-gray-500 truncate">{post.fullName}</p>}
        </div>
        <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
      </div>

      {/* Media */}
      {media.length > 0 && (
        <div className="relative bg-black aspect-square">
          <img
            src={currentMedia?.mediumUrl ?? currentMedia?.url ?? ''}
            alt=""
            className="w-full h-full object-contain"
          />
          {media.length > 1 && (
            <>
              {mediaIndex > 0 && (
                <button
                  onClick={() => setMediaIndex((i) => i - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center"
                >
                  ‹
                </button>
              )}
              {mediaIndex < media.length - 1 && (
                <button
                  onClick={() => setMediaIndex((i) => i + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center"
                >
                  ›
                </button>
              )}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {media.map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${i === mediaIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-3 pt-2 pb-1 flex items-center gap-4">
        <LikeButton postId={post.id} likedByViewer={post.likedByViewer} likeCount={post.likeCount} />
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
        <Link href={`/p/${post.id}`} className="ml-auto text-xs text-gray-400 hover:text-gray-600">
          View post
        </Link>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-3 pb-2 text-sm">
          <Link href={`/${post.username}`} className="font-semibold mr-1">
            {post.username}
          </Link>
          {post.caption}
        </div>
      )}

      {/* Inline comment input */}
      {showComments && user && (
        <div className="border-t border-gray-100 px-3 py-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!commentText.trim()) return;
              addComment.mutate({ postId: post.id, text: commentText.trim() });
            }}
            className="flex gap-2"
          >
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 text-sm bg-transparent outline-none"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || addComment.isPending}
              className="text-sm font-semibold text-brand disabled:opacity-40"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
