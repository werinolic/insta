import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthGuard } from '@/components/AuthGuard';
import { FilePickerButton } from '@/components/FilePickerButton';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// ─── Profile Settings ──────────────────────────────────────────────────────
function ProfileSettings() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.accessToken);
  const [form, setForm] = useState({ fullName: '', bio: '', website: '', avatarUrl: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

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
    onError: (e) => { setProfileErr(e.message); setProfileMsg(''); },
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleAvatarPick(files: import('@/components/FilePickerButton').PickedFile[]) {
    const file = files[0];
    if (!file || !token) return;
    setAvatarUploading(true);
    setProfileErr('');
    try {
      const res = await fetch(
        `${API_URL}/upload?purpose=avatar&filename=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          body: file.blob,
          headers: { 'Content-Type': file.mimeType, Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error('Upload failed');
      const { url } = (await res.json()) as { url: string };
      setForm((f) => ({ ...f, avatarUrl: url }));
    } catch {
      setProfileErr('Avatar upload failed.');
    } finally {
      setAvatarUploading(false);
    }
  }

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
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                👤
              </div>
            )}
          </div>
          <FilePickerButton
            onFiles={handleAvatarPick}
            disabled={avatarUploading}
            className="text-sm text-blue-500 font-semibold hover:underline disabled:opacity-40"
          >
            {avatarUploading ? 'Uploading…' : 'Change photo'}
          </FilePickerButton>
        </div>
        <Input label="Full name" value={form.fullName} onChange={set('fullName')} />
        <Input label="Bio" value={form.bio} onChange={set('bio')} />
        <Input label="Website" type="url" value={form.website} onChange={set('website')} />
        {profileMsg && <p className="text-sm text-green-600">{profileMsg}</p>}
        {profileErr && <p className="text-sm text-red-500">{profileErr}</p>}
        <Button type="submit" loading={update.isPending}>Save changes</Button>
      </form>
    </section>
  );
}

// ─── Username Settings ─────────────────────────────────────────────────────
function UsernameSettings() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.accessToken);
  const [username, setUsername] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { if (user) setUsername(user.username); }, [user]);

  const change = trpc.auth.changeUsername.useMutation({
    onSuccess: (updated) => {
      if (token) setAuth(token, updated);
      setMsg('Username changed.');
      setErr('');
    },
    onError: (e) => { setErr(e.message); setMsg(''); },
  });

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold mb-1">Change username</h2>
      <p className="text-xs text-gray-500 mb-4">You can change your username once every 14 days.</p>
      <form
        onSubmit={(e) => { e.preventDefault(); change.mutate({ username }); }}
        className="space-y-4"
      >
        <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        {msg && <p className="text-sm text-green-600">{msg}</p>}
        {err && <p className="text-sm text-red-500">{err}</p>}
        <Button type="submit" loading={change.isPending}>Change username</Button>
      </form>
    </section>
  );
}

// ─── Password Settings ─────────────────────────────────────────────────────
function PasswordSettings() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const change = trpc.auth.changePassword.useMutation({
    onSuccess: () => { setMsg('Password changed.'); setErr(''); setForm({ currentPassword: '', newPassword: '' }); },
    onError: (e) => { setErr(e.message); setMsg(''); },
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold mb-4">Change password</h2>
      <form onSubmit={(e) => { e.preventDefault(); change.mutate(form); }} className="space-y-4">
        <Input label="Current password" type="password" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" />
        <Input label="New password" type="password" value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password" />
        {msg && <p className="text-sm text-green-600">{msg}</p>}
        {err && <p className="text-sm text-red-500">{err}</p>}
        <Button type="submit" loading={change.isPending}>Change password</Button>
      </form>
    </section>
  );
}

// ─── Archived Posts ────────────────────────────────────────────────────────
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
      <p className="text-xs text-gray-500 mb-4">Only you can see these. Unarchive to make them public again.</p>
      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}
      {!isLoading && items.length === 0 && <p className="text-sm text-gray-400">No archived posts.</p>}
      <div className="grid grid-cols-3 gap-0.5">
        {items.map((post) => (
          <div key={post.id} className="relative group aspect-square bg-gray-100 overflow-hidden">
            {post.thumbnailUrl ? (
              <img src={post.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
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

// ─── Danger Zone ───────────────────────────────────────────────────────────
function DangerZone() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const utils = trpc.useUtils();
  const [password, setPassword] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState('');

  const del = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      clearAuth();
      utils.invalidate();
      navigate('/login', { replace: true });
    },
    onError: (e) => setErr(e.message),
  });

  return (
    <section className="bg-white border border-red-200 rounded-xl p-6">
      <h2 className="font-semibold text-red-600 mb-1">Delete account</h2>
      <p className="text-xs text-gray-500 mb-4">
        Permanently deletes your account and all your posts. This cannot be undone.
      </p>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700"
        >
          Delete my account
        </button>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); setErr(''); del.mutate({ password }); }}
          className="space-y-3"
        >
          <Input
            label="Confirm your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {err && <p className="text-sm text-red-500">{err}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setConfirming(false); setErr(''); }}
              className="px-4 py-2 border border-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <Button type="submit" loading={del.isPending} className="bg-red-600 hover:bg-red-700">
              Confirm delete
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="scrollable h-full">
        <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
          <h1 className="text-xl font-semibold">Settings</h1>
          <ProfileSettings />
          <UsernameSettings />
          <PasswordSettings />
          <ArchivedPosts />
          <DangerZone />
        </div>
      </div>
    </AuthGuard>
  );
}
