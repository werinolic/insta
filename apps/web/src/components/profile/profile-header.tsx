'use client';

import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';

interface ProfileHeaderProps {
  username: string;
  onFollow?: () => void;
}

export function ProfileHeader({ username }: ProfileHeaderProps) {
  const currentUser = useAuthStore((s) => s.user);
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.users.byUsername.useQuery({ username });

  const follow = trpc.follows.follow.useMutation({
    onSettled: () => utils.users.byUsername.invalidate({ username }),
  });
  const unfollow = trpc.follows.unfollow.useMutation({
    onSettled: () => utils.users.byUsername.invalidate({ username }),
  });

  if (isLoading) return <div className="h-32 animate-pulse bg-gray-100 rounded-lg" />;
  if (!profile) return null;

  const isOwn = currentUser?.id === profile.id;

  return (
    <div className="flex gap-6 items-start py-6">
      <div className="flex-shrink-0">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt=""
            className="w-24 h-24 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-semibold text-gray-500">
            {profile.username[0].toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h1 className="text-xl font-semibold">{profile.username}</h1>
          {!isOwn && (
            <button
              onClick={() => {
                if (profile.isFollowing) {
                  unfollow.mutate({ username: profile.username });
                } else {
                  follow.mutate({ username: profile.username });
                }
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                profile.isFollowing
                  ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  : 'bg-brand text-white hover:bg-blue-600'
              }`}
            >
              {profile.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        <div className="flex gap-6 mb-3 text-sm">
          <span>
            <strong>{profile.postCount}</strong> posts
          </span>
          <span>
            <strong>{profile.followerCount}</strong> followers
          </span>
          <span>
            <strong>{profile.followingCount}</strong> following
          </span>
        </div>
        {profile.fullName && <p className="font-semibold text-sm">{profile.fullName}</p>}
        {profile.bio && <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>}
        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand hover:underline"
          >
            {profile.website.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>
    </div>
  );
}
