import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthGuard } from '@/components/AuthGuard';
import { LikeButtonLive } from '@/components/post/LikeButton';
import { CommentList } from '@/components/post/CommentList';
import { PostActionsMenu } from '@/components/post/PostActionsMenu';
import { renderMentions } from '@/lib/mentions';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';
import { Spinner } from '@/components/ui/Spinner';

function PostDetailContent({ postId }: { postId: string }) {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const utils = trpc.useUtils();

  const { data: post, isLoading } = trpc.posts.byId.useQuery({ postId });

  const addComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      setCommentText('');
      utils.comments.list.invalidate({ postId });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  if (!post) {
    return <p className="text-center text-gray-500 py-12">Post not found.</p>;
  }

  const media = post.media ?? [];
  const currentMedia = media[mediaIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
      >
        ← Back
      </button>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col md:flex-row">
        {/* Media */}
        {media.length > 0 && (
          <div
            className="relative bg-black md:w-1/2 aspect-square outline-none"
            tabIndex={media.length > 1 ? 0 : undefined}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') setMediaIndex((i) => Math.max(0, i - 1));
              if (e.key === 'ArrowRight') setMediaIndex((i) => Math.min(media.length - 1, i + 1));
            }}
          >
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

        {/* Side panel */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Author header */}
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <button
              onClick={() => navigate(`/${post.username}`)}
              className="flex-shrink-0"
            >
              {post.avatarUrl ? (
                <img src={post.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                  {post.username[0].toUpperCase()}
                </div>
              )}
            </button>
            <button
              onClick={() => navigate(`/${post.username}`)}
              className="text-sm font-semibold hover:underline flex-1"
            >
              {post.username}
            </button>
            <PostActionsMenu postId={post.id} postUserId={post.userId} isArchived={post.isArchived} />
          </div>

          {/* Caption + comments */}
          <div className="flex-1 scrollable p-3 space-y-3">
            {post.caption && (
              <p className="text-sm">
                <button
                  onClick={() => navigate(`/${post.username}`)}
                  className="font-semibold mr-1 hover:underline"
                >
                  {post.username}
                </button>
                {renderMentions(post.caption)}
              </p>
            )}
            <CommentList postId={postId} />
          </div>

          {/* Like + comment input */}
          <div className="border-t border-gray-100 p-3">
            <div className="flex items-center gap-3 mb-3">
              <LikeButtonLive
                postId={post.id}
                likedByViewer={post.likedByViewer}
                likeCount={post.likeCount}
              />
            </div>
            {currentUser && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!commentText.trim()) return;
                  addComment.mutate({ postId, text: commentText.trim() });
                }}
                className="flex gap-2"
              >
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment…"
                  className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:border-gray-400"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  if (!postId) return null;

  return (
    <AuthGuard>
      <div className="scrollable h-full">
        <PostDetailContent postId={postId} />
      </div>
    </AuthGuard>
  );
}
