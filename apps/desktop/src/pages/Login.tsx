import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = trpc.auth.login.useMutation({
    onSuccess: ({ accessToken, user, sessionId }) => {
      setAuth(accessToken, user, sessionId ?? undefined);
      navigate('/', { replace: true });
    },
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    login.mutate({ emailOrUsername, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h1 className="text-2xl font-semibold text-center mb-8 tracking-tighter">Insta</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email or username"
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="Email or username"
              required
              autoComplete="username"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" loading={login.isPending}>
              Log in
            </Button>
          </form>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 mt-3 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-brand hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
