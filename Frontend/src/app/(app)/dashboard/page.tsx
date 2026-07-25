'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  LEAD_STATUSES,
  STATUS_LABELS,
  type DashboardStats,
  type Lead,
  type LeadStatus,
} from '@/lib/types';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Lead[]>([]);
  const [unassigned, setUnassigned] = useState<Lead[]>([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const tasks: Promise<unknown>[] = [
      apiRequest<{ data: DashboardStats }>('/api/leads/dashboard/stats'),
      apiRequest<{ data: Lead[] }>('/api/leads?limit=5'),
    ];
    if (isAdmin) {
      tasks.push(apiRequest<{ data: Lead[] }>('/api/leads?assignedTo=unassigned&limit=5'));
    }

    Promise.all(tasks)
      .then((results) => {
        const [statsRes, leadsRes, unassignedRes] = results as [
          { data: DashboardStats },
          { data: Lead[] },
          { data: Lead[] }?,
        ];
        setStats(statsRes.data);
        setRecent(leadsRes.data);
        if (unassignedRes) setUnassigned(unassignedRes.data);
      })
      .catch((err) => setError(err.message || 'Failed to load dashboard'));
  }, [isAdmin]);

  const statusCards = LEAD_STATUSES.slice(0, isAdmin ? 4 : 5);

  return (
    <div
      className={`space-y-8 transition duration-700 ${
        ready ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <section className="overflow-hidden rounded-2xl border border-teal-900/10 bg-[linear-gradient(125deg,#0f766e_0%,#115e59_48%,#0f1c1f_100%)] px-6 py-8 text-white md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-100/80">
              Workspace
            </p>
            <h1 className="mt-2 font-display text-3xl md:text-4xl">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="mt-2 max-w-xl text-teal-50/85">
              {isAdmin
                ? 'Pipeline overview across the team — assign owners and keep deals moving.'
                : 'Your assigned pipeline at a glance — update status and leave notes.'}
            </p>
            <p className="mt-4 inline-flex rounded-md bg-amber-300/95 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-950">
              Built for Digital Heroes Training Task
            </p>
          </div>
          <Link
            href="/leads"
            className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-teal-950 transition hover:bg-teal-50"
          >
            View all leads
          </Link>
        </div>
      </section>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="stat-tile">
          <p className="text-sm text-slate-500">Total leads</p>
          <p className="mt-3 font-display text-4xl text-slate-900">{stats?.total ?? '—'}</p>
        </div>
        {isAdmin ? (
          <Link href="/leads?assignedTo=unassigned" className="stat-tile group">
            <p className="text-sm text-slate-500">Unassigned</p>
            <p className="mt-3 font-display text-4xl text-slate-900">{stats?.unassigned ?? '—'}</p>
            <p className="mt-3 text-xs font-medium text-teal-800 group-hover:underline">
              Open queue to assign →
            </p>
          </Link>
        ) : null}
        {statusCards.map((status) => (
          <div key={status} className="stat-tile">
            <p className="text-sm text-slate-500">{STATUS_LABELS[status as LeadStatus]}</p>
            <p className="mt-3 font-display text-4xl text-slate-900">
              {stats?.statusCounts?.[status] ?? '—'}
            </p>
          </div>
        ))}
      </section>

      {isAdmin && unassigned.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-slate-900">Needs assignment</h2>
              <p className="mt-1 text-sm text-slate-500">Leads waiting for an owner.</p>
            </div>
            <Link
              href="/leads?assignedTo=unassigned"
              className="text-sm font-medium text-teal-800 hover:underline"
            >
              Assign from list
            </Link>
          </div>
          <div className="table-shell">
            <table className="min-w-full text-left text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {unassigned.map((lead) => (
                  <tr key={lead._id} className="table-row">
                    <td className="px-4 py-3.5 font-medium text-slate-900">{lead.name}</td>
                    <td className="px-4 py-3.5 text-slate-600">{lead.company || '—'}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/leads/${lead._id}`}
                        className="font-medium text-teal-800 hover:underline"
                      >
                        Assign
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-4">
          <h2 className="font-display text-2xl text-slate-900">Recent leads</h2>
          <p className="mt-1 text-sm text-slate-500">Latest activity in your book.</p>
        </div>
        <div className="table-shell">
          <table className="min-w-full text-left text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                    {isAdmin
                      ? 'No leads yet. Public captures and manual creates will show here.'
                      : 'No leads assigned to you yet. Ask an admin to assign work, or create a lead.'}
                  </td>
                </tr>
              ) : (
                recent.map((lead) => (
                  <tr key={lead._id} className="table-row">
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/leads/${lead._id}`}
                        className="font-medium text-teal-800 hover:underline"
                      >
                        {lead.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{lead.company || '—'}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(lead.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
