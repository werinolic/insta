'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', username: '', password: '', fullName: '' });
  const [error, setError] = useState('');

  const register = trpc.auth.register.useMutation({
    onSuccess: ({ accessToken, user }) => {
      setAuth(accessToken, user);
      router.push('/');
    },
    onError: (e) => setError(e.message),
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    register.mutate(form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h1 className="text-2xl font-semibold text-center mb-2 tracking-tighter">Insta</h1>
          <p className="text-center text-gray-500 text-sm mb-6">Sign up to see photos from your friends.</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="Email address"
              required
              autoComplete="email"
            />
            <Input
              label="Full name"
              type="text"
              value={form.fullName}
              onChange={set('fullName')}
              placeholder="Full name (optional)"
              autoComplete="name"
            />
            <Input
              label="Username"
              type="text"
              value={form.username}
              onChange={set('username')}
              placeholder="Username"
              required
              autoComplete="username"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="Password (min 8 chars)"
              required
              autoComplete="new-password"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" loading={register.isPending}>
              Sign up
            </Button>
          </form>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 mt-3 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
