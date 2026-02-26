import { useParams, useNavigate } from 'react-router-dom';
import { AuthGuard } from '@/components/AuthGuard';
import { trpc } from '@/lib/trpc';
import { Spinner } from '@/components/ui/Spinner';

function FollowingList({ username }: { username: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = trpc.users.following.useQuery({ username });

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

  const items = data?.items ?? [];

  if (items.length === 0) {
    return <p className="text-center text-gray-500 py-12 text-sm">Not following anyone yet.</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {items.map((u) => (
        <button
          key={u.id}
          onClick={() => navigate(`/${u.username}`)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
        >
          {u.avatarUrl ? (
            <img src={u.avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-base font-semibold text-gray-500 flex-shrink-0">
              {u.username[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{u.username}</p>
            {u.fullName && <p className="text-xs text-gray-500 truncate">{u.fullName}</p>}
          </div>
        </button>
      ))}
    </div>
  );
}

export default function FollowingPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  if (!username) return null;

  return (
    <AuthGuard>
      <div className="scrollable h-full">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900">
              ←
            </button>
            <h1 className="font-semibold">{username} · Following</h1>
          </div>
          <FollowingList username={username} />
        </div>
      </div>
    </AuthGuard>
  );
}
