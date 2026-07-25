'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ApiError, apiRequest } from '@/lib/api';

export default function CapturePage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiRequest('/api/public/leads', {
        method: 'POST',
        body: { ...form, source: 'website' },
        auth: false,
      });
      setDone(true);
      setForm({ name: '', email: '', phone: '', company: '' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell min-h-screen lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'linear-gradient(150deg, rgba(7,38,42,0.9) 0%, rgba(13,148,136,0.7) 50%, rgba(15,28,31,0.65) 100%), url(https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1800&q=80)',
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
              Public capture
            </p>
            <h1 className="mt-4 font-display text-5xl leading-tight">
              Tell us what you need. We will follow up.
            </h1>
            <p className="mt-5 text-lg text-teal-50/85">
              No account required. Your details enter the sales pipeline as a New lead with a full
              activity trail from the first moment.
            </p>
            <p className="mt-5 inline-flex rounded-md bg-amber-300/95 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-950">
              Built for Digital Heroes Training Task
            </p>
          </div>
          <ul className="space-y-2 text-sm text-teal-100/80">
            <li>Starts at status: New</li>
            <li>Routed to the team workspace</li>
            <li>Assigned by an admin when ready</li>
          </ul>
        </div>
      </aside>

      <section className="relative flex min-h-screen flex-col justify-center bg-[#eef3f4] px-6 py-12 sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_320px_at_10%_-10%,rgba(15,118,110,0.12),transparent_55%)]" />
        <div
          className={`relative mx-auto w-full max-w-md transition duration-700 ${
            ready ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-sm font-medium text-teal-800 hover:underline lg:hidden">
              ← Lead Platform
            </Link>
            <Link
              href="/login"
              className="ml-auto text-sm font-medium text-slate-500 hover:text-teal-800 hover:underline"
            >
              Team login
            </Link>
          </div>

          <p className="mt-6 font-display text-4xl text-slate-900">Talk with our team</p>
          <p className="mt-2 text-slate-600">
            Share a few details and we will get back to you shortly.
          </p>

          {done ? (
            <div className="landing-reveal mt-8 rounded-2xl border border-teal-200 bg-teal-50/70 p-6">
              <p className="font-display text-2xl text-teal-950">Thanks — we received your lead.</p>
              <p className="mt-3 text-sm leading-relaxed text-teal-900/80">
                It is now in the pipeline as New. Our team will follow up using the contact details
                you shared.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className="btn-primary" onClick={() => setDone(false)}>
                  Submit another
                </button>
                <Link href="/" className="btn-secondary">
                  Back to home
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mt-8 space-y-4 rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm"
            >
              <div>
                <label className="label" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  className="input"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="label" htmlFor="email">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="phone">
                    Phone
                  </label>
                  <input
                    id="phone"
                    className="input"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="company">
                    Company
                  </label>
                  <input
                    id="company"
                    className="input"
                    autoComplete="organization"
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  />
                </div>
              </div>
              {error ? <p className="text-sm text-rose-700">{error}</p> : null}
              <button type="submit" className="btn-primary w-full py-2.5" disabled={submitting}>
                {submitting ? 'Sending…' : 'Submit lead'}
              </button>
              <p className="text-center text-xs text-slate-500">
                By submitting, you agree to be contacted about this inquiry.
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
