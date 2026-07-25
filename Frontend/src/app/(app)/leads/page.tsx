'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  LEAD_STATUSES,
  STATUS_LABELS,
  refId,
  type Lead,
  type LeadStatus,
  type Paginated,
  type User,
} from '@/lib/types';

export default function LeadsPage() {
  const { isAdmin } = useAuth();
  const [result, setResult] = useState<Paginated<Lead> | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    assignedTo: '',
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('assignedTo') === 'unassigned') {
      setAssignedTo('unassigned');
    }
  }, []);

  const load = useCallback(async () => {
    setError('');
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
    });
    if (status) params.set('status', status);
    if (assignedTo) params.set('assignedTo', assignedTo);
    if (q.trim()) params.set('q', q.trim());

    try {
      const data = await apiRequest<Paginated<Lead>>(`/api/leads?${params.toString()}`);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load leads');
    }
  }, [page, status, assignedTo, q]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isAdmin) return;
    apiRequest<{ data: User[] }>('/api/users')
      .then((res) => setUsers(res.data))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load team members for assignment')
      );
  }, [isAdmin]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const body: Record<string, string> = {
        name: createForm.name,
        email: createForm.email,
        phone: createForm.phone,
        company: createForm.company,
      };
      if (isAdmin && createForm.assignedTo) {
        body.assignedTo = createForm.assignedTo;
      }
      await apiRequest('/api/leads', { method: 'POST', body });
      setShowCreate(false);
      setCreateForm({ name: '', email: '', phone: '', company: '', assignedTo: '' });
      setPage(1);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create lead');
    } finally {
      setCreating(false);
    }
  }

  async function assignLead(leadId: string, userId: string) {
    setAssigningId(leadId);
    setError('');
    try {
      await apiRequest(`/api/leads/${leadId}`, {
        method: 'PATCH',
        body: { assignedTo: userId || null },
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to assign lead');
    } finally {
      setAssigningId(null);
    }
  }

  const emptyMessage = isAdmin
    ? 'No leads match these filters. Try Unassigned, or wait for public captures.'
    : 'No leads assigned to you yet. Ask an admin to assign leads, or create one (it will be assigned to you).';

  return (
    <div
      className={`space-y-6 transition duration-700 ${
        ready ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-800">Pipeline</p>
          <h1 className="mt-2 font-display text-3xl text-slate-900 md:text-4xl">Leads</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            {isAdmin
              ? 'Filter the pipeline and assign owners from the list or lead detail.'
              : 'Your assigned leads — update status and add notes.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setPage(1);
                setAssignedTo('unassigned');
              }}
            >
              Unassigned queue
            </button>
          ) : null}
          <button type="button" className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Cancel' : 'New lead'}
          </button>
        </div>
      </div>

      {showCreate ? (
        <form
          onSubmit={onCreate}
          className="grid gap-4 rounded-2xl border border-teal-200/70 bg-teal-50/40 p-5 md:grid-cols-2 md:p-6"
        >
          <div className="md:col-span-2">
            <h2 className="font-display text-xl text-slate-900">Create lead</h2>
            <p className="mt-1 text-sm text-slate-600">
              {isAdmin
                ? 'Optionally assign an owner now, or leave unassigned.'
                : 'This lead will be assigned to you automatically.'}
            </p>
          </div>
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              required
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={createForm.phone}
              onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Company</label>
            <input
              className="input"
              value={createForm.company}
              onChange={(e) => setCreateForm((f) => ({ ...f, company: e.target.value }))}
            />
          </div>
          {isAdmin ? (
            <div className="md:col-span-2">
              <label className="label">Assign to</label>
              <select
                className="input"
                value={createForm.assignedTo}
                onChange={(e) => setCreateForm((f) => ({ ...f, assignedTo: e.target.value }))}
              >
                <option value="">Leave unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create lead'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm md:p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="label">Search</label>
            <input
              className="input"
              placeholder="Name, email, company"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <option value="">All</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          {isAdmin ? (
            <div>
              <label className="label">Assignee filter</label>
              <select
                className="input"
                value={assignedTo}
                onChange={(e) => {
                  setPage(1);
                  setAssignedTo(e.target.value);
                }}
              >
                <option value="">All</option>
                <option value="unassigned">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="hidden md:block" />
          )}
          <div className="flex items-end">
            <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {result ? `${result.total} result${result.total === 1 ? '' : 's'}` : 'Loading…'}
            </p>
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <div className="table-shell">
        <table className="min-w-full text-left text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">{isAdmin ? 'Assign' : 'Assignee'}</th>
            </tr>
          </thead>
          <tbody>
            {!result || result.data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-14 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              result.data.map((lead) => (
                <tr key={lead._id} className="table-row">
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/leads/${lead._id}`}
                      className="font-medium text-teal-800 hover:underline"
                    >
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{lead.email}</td>
                  <td className="px-4 py-3.5 text-slate-600">{lead.company || '—'}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={lead.status as LeadStatus} />
                  </td>
                  <td className="px-4 py-3.5">
                    {isAdmin ? (
                      <select
                        className="input min-w-[10rem]"
                        disabled={assigningId === lead._id}
                        value={refId(lead.assignedTo)}
                        onChange={(e) => assignLead(lead._id, e.target.value)}
                        aria-label={`Assign ${lead.name}`}
                      >
                        <option value="">Unassigned</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-slate-600">{lead.assignedTo?.name || 'Unassigned'}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {result && result.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <p className="text-sm text-slate-500">
            Page {result.page} of {result.totalPages}
          </p>
          <button
            type="button"
            className="btn-secondary"
            disabled={page >= result.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
