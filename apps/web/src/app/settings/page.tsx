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

function ArchivedPosts() {
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.posts.archived.useQuery({ limit: 50 });

  const unarchive = trpc.posts.archive.useMutation({
    onSuccess: () => {
      utils.posts.archived.invalidate();
      utils.posts.feed.invalidate();
      utils.posts.byUsername.invalidate();
    },
  });

  const del = trpc.posts.delete.useMutation({
    onSuccess: () => utils.posts.archived.invalidate(),
  });

  const items = data?.items ?? [];

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold mb-1">Archived posts</h2>
      <p className="text-xs text-gray-500 mb-4">
        Only you can see these. Unarchive to make them public again.
      </p>

      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}

      {!isLoading && items.length === 0 && (
        <p className="text-sm text-gray-400">No archived posts.</p>
      )}

      <div className="grid grid-cols-3 gap-0.5">
        {items.map((post) => (
          <div key={post.id} className="relative group aspect-square bg-gray-100 overflow-hidden">
            {post.thumbnailUrl ? (
              <img
                src={post.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 hidden group-hover:flex flex-col items-center justify-center gap-1.5 bg-black/50">
              <button
                onClick={() => unarchive.mutate({ postId: post.id })}
                disabled={unarchive.isPending}
                className="px-2.5 py-1 bg-white text-gray-900 text-xs font-semibold rounded-lg hover:bg-gray-100 w-24 disabled:opacity-50"
              >
                Unarchive
              </button>
              <button
                onClick={() => del.mutate({ postId: post.id })}
                disabled={del.isPending}
                className="px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 w-24 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
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
          <ArchivedPosts />
        </div>
      </main>
    </AuthGuard>
  );
}
