import { useParams } from 'react-router-dom';
import { AuthGuard } from '@/components/AuthGuard';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PostGrid } from '@/components/profile/PostGrid';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  if (!username) return null;

  return (
    <AuthGuard>
      <div className="scrollable h-full">
        <div className="max-w-3xl mx-auto px-4">
          <ProfileHeader username={username} />
          <div className="border-t border-gray-200 pt-4">
            <PostGrid username={username} />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
