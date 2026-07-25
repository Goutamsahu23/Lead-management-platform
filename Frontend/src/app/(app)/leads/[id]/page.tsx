'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { ApiError, apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  LEAD_STATUSES,
  STATUS_LABELS,
  refId,
  type Activity,
  type Lead,
  type LeadStatus,
  type Note,
  type User,
} from '@/lib/types';

function formatActivity(activity: Activity) {
  switch (activity.type) {
    case 'created':
      return 'Lead created';
    case 'status_changed':
      return `Status changed from ${activity.meta.from} to ${activity.meta.to}`;
    case 'assigned': {
      const toName = activity.meta.toName || activity.meta.to;
      return toName ? `Assigned to ${String(toName)}` : 'Unassigned';
    }
    case 'note_added':
      return `Note added: ${String(activity.meta.preview || '')}`;
    default:
      return activity.type;
  }
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [noteBody, setNoteBody] = useState('');
  const [error, setError] = useState('');
  const [usersError, setUsersError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [leadRes, notesRes, activitiesRes] = await Promise.all([
        apiRequest<{ data: Lead }>(`/api/leads/${params.id}`),
        apiRequest<{ data: Note[] }>(`/api/leads/${params.id}/notes`),
        apiRequest<{ data: Activity[] }>(`/api/leads/${params.id}/activities`),
      ]);
      setLead(leadRes.data);
      setNotes(notesRes.data);
      setActivities(activitiesRes.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load lead');
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isAdmin) return;
    apiRequest<{ data: User[] }>('/api/users')
      .then((res) => {
        setUsers(res.data);
        setUsersError('');
      })
      .catch((err) =>
        setUsersError(err instanceof ApiError ? err.message : 'Could not load team for assignment')
      );
  }, [isAdmin]);

  async function updateLead(payload: Record<string, unknown>) {
    setSaving(true);
    setError('');
    try {
      const res = await apiRequest<{ data: Lead }>(`/api/leads/${params.id}`, {
        method: 'PATCH',
        body: payload,
      });
      setLead(res.data);
      const activitiesRes = await apiRequest<{ data: Activity[] }>(
        `/api/leads/${params.id}/activities`
      );
      setActivities(activitiesRes.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function onAddNote(e: FormEvent) {
    e.preventDefault();
    if (!noteBody.trim()) return;
    setSaving(true);
    setError('');
    try {
      await apiRequest(`/api/leads/${params.id}/notes`, {
        method: 'POST',
        body: { body: noteBody.trim() },
      });
      setNoteBody('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add note');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!isAdmin || !confirm('Delete this lead permanently?')) return;
    try {
      await apiRequest(`/api/leads/${params.id}`, { method: 'DELETE' });
      router.push('/leads');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  if (!lead && !error) {
    return <p className="text-slate-500">Loading lead…</p>;
  }

  if (!lead) {
    return (
      <div>
        <p className="text-rose-700">{error}</p>
        <Link href="/leads" className="btn-secondary mt-4 inline-flex">
          Back to leads
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/leads" className="text-sm text-teal-800 hover:underline">
        ← Back to leads
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-slate-900">{lead.name}</h1>
          <p className="mt-1 text-slate-600">
            {lead.email}
            {lead.company ? ` · ${lead.company}` : ''}
          </p>
          <div className="mt-3">
            <StatusBadge status={lead.status} />
          </div>
        </div>
        {isAdmin ? (
          <button type="button" className="btn-danger" onClick={onDelete}>
            Delete
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

      {isAdmin ? (
        <section className="panel mt-6 border-teal-200 bg-teal-50/40">
          <h2 className="font-display text-xl text-slate-900">Assign lead</h2>
          <p className="mt-1 text-sm text-slate-600">
            Choose a team member who will own follow-up for this lead.
          </p>
          {usersError ? <p className="mt-2 text-sm text-rose-700">{usersError}</p> : null}
          <select
            className="input mt-4 max-w-md"
            disabled={saving || users.length === 0}
            value={refId(lead.assignedTo)}
            onChange={(e) =>
              updateLead({
                assignedTo: e.target.value ? e.target.value : null,
              })
            }
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
          {users.length === 0 && !usersError ? (
            <p className="mt-2 text-sm text-slate-500">
              No team members found. Add users on the Users page.
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="panel space-y-4 lg:col-span-1">
          <h2 className="font-display text-xl text-slate-900">Details</h2>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Phone</p>
            <p className="mt-1 text-slate-800">{lead.phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Source</p>
            <p className="mt-1 text-slate-800">{lead.source || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Created</p>
            <p className="mt-1 text-slate-800">{new Date(lead.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Assignee</p>
            <p className="mt-1 text-slate-800">{lead.assignedTo?.name || 'Unassigned'}</p>
          </div>

          <div>
            <label className="label" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              className="input"
              disabled={saving}
              value={lead.status}
              onChange={(e) => updateLead({ status: e.target.value as LeadStatus })}
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="space-y-6 lg:col-span-2">
          <div className="panel">
            <h2 className="font-display text-xl text-slate-900">Notes</h2>
            <form onSubmit={onAddNote} className="mt-4 space-y-3">
              <textarea
                className="input min-h-24"
                placeholder="Add a timestamped note…"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={saving || !noteBody.trim()}>
                Add note
              </button>
            </form>
            <ul className="mt-6 space-y-4">
              {notes.length === 0 ? (
                <li className="text-sm text-slate-500">No notes yet.</li>
              ) : (
                notes.map((note) => (
                  <li key={note._id} className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">
                        {note.authorId?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{note.body}</p>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="panel">
            <h2 className="font-display text-xl text-slate-900">Activity trail</h2>
            <ul className="mt-4 space-y-3">
              {activities.map((activity) => (
                <li key={activity._id} className="flex gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-600" />
                  <div>
                    <p className="text-slate-800">{formatActivity(activity)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {activity.actorId?.name || 'Public'} ·{' '}
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
