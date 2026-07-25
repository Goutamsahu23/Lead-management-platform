'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ProfilePage() {
  const { user, refreshUser, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (isAdmin) {
      router.replace('/users');
    }
  }, [isAdmin, loading, router]);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {
        name: name.trim(),
        email: email.trim(),
      };
      if (password) {
        body.password = password;
        body.currentPassword = currentPassword;
      }

      const res = await apiRequest<{ user: typeof user }>('/api/auth/me', {
        method: 'PATCH',
        body,
      });

      if (res.user) {
        refreshUser(res.user);
      }

      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading || isAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div
      className={`mx-auto max-w-2xl space-y-6 transition duration-700 ${
        ready ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-800">Account</p>
        <h1 className="mt-2 font-display text-3xl text-slate-900 md:text-4xl">Your profile</h1>
        <p className="mt-2 text-slate-600">
          Update your name, email, or password. Your role stays{' '}
          <span className="font-medium capitalize text-teal-900">{user?.role}</span>.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm md:p-6"
      >
        <div>
          <label className="label" htmlFor="profile-name">
            Name
          </label>
          <input
            id="profile-name"
            className="input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="profile-email">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            className="input"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h2 className="font-display text-xl text-slate-900">Change password</h2>
          <p className="mt-1 text-sm text-slate-500">Leave blank to keep your current password.</p>
        </div>

        <div>
          <label className="label" htmlFor="current-password">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            className="input"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required={Boolean(password)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="confirm-password">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="text-sm text-teal-800">{success}</p> : null}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
