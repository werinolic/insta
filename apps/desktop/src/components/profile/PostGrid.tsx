import { useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { Spinner } from '../ui/Spinner';

interface PostGridProps {
  username: string;
}

export function PostGrid({ username }: PostGridProps) {
  const navigate = useNavigate();

  const { data, isLoading } = trpc.posts.byUsername.useQuery({ username, limit: 50 });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">No posts yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {items.map((post) => (
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
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
        </button>
      ))}
    </div>
  );
}
