'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/leads', label: 'Leads' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const nav = [
    ...LINKS,
    ...(isAdmin ? [{ href: '/users', label: 'Users' }] : [{ href: '/profile', label: 'Profile' }]),
  ];

  return (
    <RequireAuth>
      <div className="app-shell min-h-screen">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f7fafb]/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
            <div className="flex min-w-0 items-center gap-6">
              <Link
                href="/dashboard"
                className="font-display text-xl font-semibold tracking-tight text-slate-900"
              >
                Lead Platform
              </Link>
              <nav className="hidden items-center gap-1 sm:flex">
                {nav.map((link) => {
                  const active = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                        active
                          ? 'bg-teal-800 text-white'
                          : 'text-slate-600 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {isAdmin ? (
                <div className="hidden rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-right sm:block">
                  <p className="font-medium text-slate-900">{user?.name}</p>
                  <p className="text-xs capitalize text-teal-800">{user?.role}</p>
                </div>
              ) : (
                <Link
                  href="/profile"
                  className="hidden rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-right transition hover:border-teal-300 sm:block"
                >
                  <p className="font-medium text-slate-900">{user?.name}</p>
                  <p className="text-xs capitalize text-teal-800">{user?.role}</p>
                </Link>
              )}
              <button type="button" className="btn-secondary" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-slate-200/70 px-4 py-2 sm:hidden">
            {nav.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${
                    active ? 'bg-teal-800 text-white' : 'bg-white text-slate-600'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8 md:py-10">{children}</main>
      </div>
    </RequireAuth>
  );
}
