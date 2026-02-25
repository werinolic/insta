import { ProfileHeader } from '@/components/profile/profile-header';
import { PostGrid } from '@/components/profile/post-grid';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Navbar } from '@/components/nav/navbar';

interface Props {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  return (
    <AuthGuard>
      <Navbar />
      <main className="pt-14">
        <div className="max-w-3xl mx-auto px-4">
          <ProfileHeader username={username} />
          <div className="border-t border-gray-200 pt-4">
            <PostGrid username={username} />
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
