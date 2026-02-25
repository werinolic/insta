'use client';

import { use } from 'react';
import { trpc } from '@/lib/trpc';
import { PostCard } from '@/components/post/post-card';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Navbar } from '@/components/nav/navbar';
import { Spinner } from '@/components/ui/spinner';
import { CommentList } from '@/components/post/comment-list';

interface Props {
  params: Promise<{ postId: string }>;
}

export default function PostPage({ params }: Props) {
  const { postId } = use(params);
  return (
    <AuthGuard>
      <Navbar />
      <main className="pt-14">
        <div className="max-w-lg mx-auto px-4 py-6">
          <PostDetail postId={postId} />
        </div>
      </main>
    </AuthGuard>
  );
}

function PostDetail({ postId }: { postId: string }) {
  const { data: post, isLoading } = trpc.posts.byId.useQuery({ postId });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!post) return <p className="text-center text-gray-500 py-12">Post not found.</p>;

  return (
    <div className="space-y-4">
      <PostCard post={post} />
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold mb-3">Comments</h2>
        <CommentList postId={postId} />
      </div>
    </div>
  );
}
