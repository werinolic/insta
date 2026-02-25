import { Feed } from '@/components/feed/feed';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Navbar } from '@/components/nav/navbar';

export default function HomePage() {
  return (
    <AuthGuard>
      <Navbar />
      <main className="pt-14">
        <div className="max-w-lg mx-auto px-4 py-6">
          <Feed />
        </div>
      </main>
    </AuthGuard>
  );
}
