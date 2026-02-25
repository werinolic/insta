'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Navbar } from '@/components/nav/navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function ProfileSettings() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.accessToken);
  const [form, setForm] = useState({
    fullName: '',
    bio: '',
    website: '',
    avatarUrl: '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName ?? '',
        bio: user.bio ?? '',
        website: user.website ?? '',
        avatarUrl: user.avatarUrl ?? '',
      });
    }
  }, [user]);

  const update = trpc.auth.updateProfile.useMutation({
    onSuccess: (updated) => {
      if (token) setAuth(token, updated);
      setProfileMsg('Profile updated.');
      setProfileErr('');
    },
    onError: (e) => {
      setProfileErr(e.message);
      setProfileMsg('');
    },
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold mb-4">Edit profile</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate({
            fullName: form.fullName || undefined,
            bio: form.bio || undefined,
            website: form.website || undefined,
            avatarUrl: form.avatarUrl || undefined,
          });
        }}
        className="space-y-4"
      >
        <Input label="Full name" value={form.fullName} onChange={set('fullName')} />
        <Input label="Bio" value={form.bio} onChange={set('bio')} />
        <Input label="Website" type="url" value={form.website} onChange={set('website')} />
        <Input label="Avatar URL" type="url" value={form.avatarUrl} onChange={set('avatarUrl')} />
        {profileMsg && <p className="text-sm text-green-600">{profileMsg}</p>}
        {profileErr && <p className="text-sm text-red-500">{profileErr}</p>}
        <Button type="submit" loading={update.isPending}>Save changes</Button>
      </form>
    </section>
  );
}

function PasswordSettings() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const change = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      setMsg('Password changed.');
      setErr('');
      setForm({ currentPassword: '', newPassword: '' });
    },
    onError: (e) => {
      setErr(e.message);
      setMsg('');
    },
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold mb-4">Change password</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          change.mutate(form);
        }}
        className="space-y-4"
      >
        <Input
          label="Current password"
          type="password"
          value={form.currentPassword}
          onChange={set('currentPassword')}
          autoComplete="current-password"
        />
        <Input
          label="New password"
          type="password"
          value={form.newPassword}
          onChange={set('newPassword')}
          autoComplete="new-password"
        />
        {msg && <p className="text-sm text-green-600">{msg}</p>}
        {err && <p className="text-sm text-red-500">{err}</p>}
        <Button type="submit" loading={change.isPending}>Change password</Button>
      </form>
    </section>
  );
}

function UsernameSettings() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.accessToken);
  const [username, setUsername] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (user) setUsername(user.username);
  }, [user]);

  const change = trpc.auth.changeUsername.useMutation({
    onSuccess: (updated) => {
      if (token) setAuth(token, updated);
      setMsg('Username changed.');
      setErr('');
    },
    onError: (e) => {
      setErr(e.message);
      setMsg('');
    },
  });

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold mb-1">Change username</h2>
      <p className="text-xs text-gray-500 mb-4">You can change your username once every 14 days.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          change.mutate({ username });
        }}
        className="space-y-4"
      >
        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        {msg && <p className="text-sm text-green-600">{msg}</p>}
        {err && <p className="text-sm text-red-500">{err}</p>}
        <Button type="submit" loading={change.isPending}>Change username</Button>
      </form>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <Navbar />
      <main className="pt-14">
        <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
          <h1 className="text-xl font-semibold">Settings</h1>
          <ProfileSettings />
          <UsernameSettings />
          <PasswordSettings />
        </div>
      </main>
    </AuthGuard>
  );
}
