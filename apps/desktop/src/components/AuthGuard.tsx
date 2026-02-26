import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { Spinner } from './ui/Spinner';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!token) navigate('/login', { replace: true });
    }, 600);
    return () => clearTimeout(t);
  }, [token, navigate]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
