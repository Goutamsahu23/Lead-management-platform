'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    email: 'admin@leadplatform.com',
    password: 'Admin123!',
    note: 'See all leads, assign owners, manage users',
  },
  {
    role: 'Member',
    email: 'member@leadplatform.com',
    password: 'Member123!',
    note: 'Work assigned leads, update status and notes',
  },
];

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email.trim(), password);
      router.replace('/dashboard');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof TypeError
            ? 'Cannot reach the API. Is the Backend running on port 5000?'
            : 'Login failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  }

  return (
    <main className="auth-shell min-h-screen lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'linear-gradient(155deg, rgba(7,38,42,0.92) 0%, rgba(15,118,110,0.75) 55%, rgba(12,24,28,0.7) 100%), url(https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1800&q=80)',
          }}
        />
        <div className="landing-grid absolute inset-0 opacity-20" />
        <div className="landing-sheen absolute inset-0" />
        <div className="relative z-10 flex h-full min-h-screen flex-col justify-between p-10 text-white">
          <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
            Lead Platform
          </Link>
          <div
            className={`max-w-md transition duration-1000 ${
              ready ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-100/80">
              Sales workspace
            </p>
            <h1 className="mt-4 font-display text-5xl leading-tight">
              Pick up the pipeline where your team left off.
            </h1>
            <p className="mt-5 text-lg text-teal-50/85">
              Status, assignment, notes, and activity — in one focused place for small sales teams.
            </p>
            <p className="mt-5 inline-flex rounded-md bg-amber-300/95 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-950">
              Built for Digital Heroes Training Task
            </p>
          </div>
          <p className="text-sm text-teal-100/70">Admin and member roles enforced on every request.</p>
        </div>
      </aside>

      <section className="relative flex min-h-screen flex-col justify-center bg-[#eef3f4] px-6 py-12 sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_320px_at_90%_-10%,rgba(15,118,110,0.12),transparent_55%)]" />
        <div
          className={`relative mx-auto w-full max-w-md transition duration-700 ${
            ready ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <Link href="/" className="text-sm font-medium text-teal-800 hover:underline lg:hidden">
            ← Lead Platform
          </Link>

          <p className="mt-6 font-display text-4xl text-slate-900 lg:mt-0">Team login</p>
          <p className="mt-2 text-slate-600">Sign in to manage leads, notes, and pipeline status.</p>

          <form
            onSubmit={onSubmit}
            className="mt-8 space-y-4 rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm"
          >
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-rose-700">{error}</p> : null}
            <button type="submit" className="btn-primary w-full py-2.5" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/80 p-5">
            <p className="text-sm font-medium text-slate-900">Demo accounts</p>
            <p className="mt-1 text-xs text-slate-500">
              Click to fill credentials. Members only see leads assigned to them.
            </p>
            <ul className="mt-4 space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email}>
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-3 text-left transition hover:border-teal-300 hover:bg-teal-50/50"
                    onClick={() => fillDemo(account)}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{account.role}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{account.email}</span>
                      <span className="mt-1 block text-xs text-slate-500">{account.note}</span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-teal-800">Use</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Visiting as a prospect?{' '}
            <Link href="/capture" className="font-medium text-teal-800 hover:underline">
              Submit a lead
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
