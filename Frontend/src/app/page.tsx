'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <main className="landing overflow-x-hidden bg-[#eef3f4] text-slate-900">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <p className="font-display text-xl font-semibold tracking-tight text-white drop-shadow-sm md:text-2xl">
            Lead Platform
          </p>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/capture"
              className="rounded-md border border-white/35 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
            >
              Capture lead
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-white px-3 py-2 text-sm font-medium text-teal-900 transition hover:bg-teal-50"
            >
              Team login
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative min-h-[100svh]">
        <div
          className={`absolute inset-0 scale-105 bg-cover bg-center transition duration-[1.4s] ease-out ${
            ready ? 'scale-100 opacity-100' : 'opacity-80'
          }`}
          style={{
            backgroundImage:
              'linear-gradient(115deg, rgba(7,38,42,0.9) 0%, rgba(15,118,110,0.68) 52%, rgba(12,24,28,0.5) 100%), url(https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=2400&q=80)',
          }}
        />
        <div className="landing-grid absolute inset-0 opacity-25" />
        <div className="landing-sheen absolute inset-0" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pb-20 pt-28 md:justify-center md:pb-28">
          <div
            className={`max-w-2xl transition duration-1000 ${
              ready ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <p className="inline-flex rounded-md bg-amber-300/95 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-950 sm:text-sm">
              Built for Digital Heroes Training Task
            </p>
            <p className="mt-4 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
              Lead Platform
            </p>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-teal-50/90 md:text-xl">
              Capture inbound interest, assign owners, and move every deal through a clear sales
              pipeline.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/capture"
                className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-teal-950 transition hover:bg-teal-50"
              >
                Submit a lead
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-white/45 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Open workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-800">How it works</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl text-slate-900 md:text-5xl">
          From first capture to closed outcome.
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {[
            {
              step: '01',
              title: 'Capture',
              copy: 'Prospects submit through a public form. Every lead starts as New with a recorded activity.',
            },
            {
              step: '02',
              title: 'Assign',
              copy: 'Admins hand ownership to the right teammate so the pipeline stays accountable.',
            },
            {
              step: '03',
              title: 'Advance',
              copy: 'Members update status, leave timestamped notes, and keep a full activity trail.',
            },
          ].map((item) => (
            <li key={item.step} className="landing-reveal border-t border-slate-300 pt-6">
              <p className="font-display text-4xl text-teal-700/35">{item.step}</p>
              <h3 className="mt-4 font-display text-2xl text-slate-900">{item.title}</h3>
              <p className="mt-3 leading-relaxed text-slate-600">{item.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-slate-200 bg-[#f7fafb]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-800">
              Built for small teams
            </p>
            <h2 className="mt-3 font-display text-3xl text-slate-900 md:text-5xl">
              Admin clarity. Member focus.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Admins see the full book and assign work. Members only see what they own — status,
              notes, and history — without the noise.
            </p>
            <Link href="/login" className="btn-primary mt-8 inline-flex">
              Enter the workspace
            </Link>
          </div>

          <div className="landing-reveal overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
                Pipeline preview
              </p>
              <p className="text-xs text-slate-500">new → won</p>
            </div>
            <ul className="divide-y divide-slate-100">
              {[
                { label: 'New', name: 'Ava Chen', company: 'Northwind' },
                { label: 'Contacted', name: 'Marcus Lee', company: 'Brightline' },
                { label: 'Qualified', name: 'Sofia Reyes', company: 'Harbor Co' },
                { label: 'Won', name: 'Jordan Park', company: 'Fieldstone' },
              ].map((row, index) => (
                <li
                  key={row.name}
                  className="landing-row flex items-center justify-between gap-4 px-5 py-4"
                  style={{ animationDelay: `${0.15 + index * 0.1}s` }}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.company}</p>
                  </div>
                  <span className="rounded bg-teal-50 px-2 py-1 text-xs font-medium text-teal-900">
                    {row.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(15,118,110,0.16),transparent_42%),radial-gradient(circle_at_85%_10%,rgba(15,28,31,0.07),transparent_38%),#e8efef]" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
          <h2 className="font-display text-3xl text-slate-900 md:text-5xl">
            Ready when your next lead arrives.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Start with a public capture, then run the pipeline from one shared workspace.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/capture" className="btn-primary px-6 py-3">
              Capture a lead
            </Link>
            <Link href="/login" className="btn-secondary px-6 py-3">
              Team login
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-base text-slate-800">Lead Platform</p>
          <p>Pipeline · assignment · notes · activity</p>
        </div>
      </footer>
    </main>
  );
}
