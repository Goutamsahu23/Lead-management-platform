'use client';

import { FormEvent, useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { ApiError, apiRequest } from '@/lib/api';
import type { Role, User } from '@/lib/types';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'member' as Role,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'closed' | 'create' | 'edit'>('closed');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  async function load() {
    try {
      const res = await apiRequest<{ data: User[] }>('/api/users');
      setUsers(res.data);
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users');
    }
  }

  useEffect(() => {
    load();
  }, []);

  function closeForm() {
    setMode('closed');
    setEditingUserId(null);
    setForm(emptyForm);
    setError('');
  }

  function openCreate() {
    setMode('create');
    setEditingUserId(null);
    setForm(emptyForm);
    setError('');
  }

  function openEdit(user: User) {
    setMode('edit');
    setEditingUserId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setError('');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (mode === 'create') {
        await apiRequest('/api/users', { method: 'POST', body: form });
      } else if (mode === 'edit' && editingUserId) {
        const body: Record<string, string> = {
          name: form.name,
          email: form.email,
          role: form.role,
        };
        if (form.password.trim()) {
          body.password = form.password;
        }
        await apiRequest(`/api/users/${editingUserId}`, {
          method: 'PATCH',
          body,
        });
      }
      closeForm();
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : mode === 'create'
            ? 'Failed to create user'
            : 'Failed to update user'
      );
    } finally {
      setSaving(false);
    }
  }

  const admins = users.filter((u) => u.role === 'admin').length;
  const members = users.filter((u) => u.role === 'member').length;
  const formOpen = mode !== 'closed';

  return (
    <RequireAuth roles={['admin']}>
      <div
        className={`space-y-6 transition duration-700 ${
          ready ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        }`}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-800">Team</p>
            <h1 className="mt-2 font-display text-3xl text-slate-900 md:text-4xl">Users</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Create teammates for assignment. Admins manage the book; members work owned leads.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => (formOpen && mode === 'create' ? closeForm() : openCreate())}
          >
            {formOpen && mode === 'create' ? 'Close form' : 'Add user'}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="stat-tile">
            <p className="text-sm text-slate-500">Total users</p>
            <p className="mt-3 font-display text-4xl text-slate-900">{users.length}</p>
          </div>
          <div className="stat-tile">
            <p className="text-sm text-slate-500">Admins</p>
            <p className="mt-3 font-display text-4xl text-slate-900">{admins}</p>
          </div>
          <div className="stat-tile">
            <p className="text-sm text-slate-500">Members</p>
            <p className="mt-3 font-display text-4xl text-slate-900">{members}</p>
          </div>
        </div>

        {error ? <p className="text-sm text-rose-700">{error}</p> : null}

        {formOpen ? (
          <form
            onSubmit={onSubmit}
            className="grid gap-4 rounded-2xl border border-teal-200/70 bg-teal-50/40 p-5 md:grid-cols-2 md:p-6"
          >
            <div className="md:col-span-2">
              <h2 className="font-display text-xl text-slate-900">
                {mode === 'create' ? 'Add team member' : 'Edit team member'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {mode === 'create'
                  ? 'They can sign in immediately with the password you set.'
                  : 'Update profile details. Leave password blank to keep the current one.'}
              </p>
            </div>
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">
                Password{mode === 'edit' ? ' (optional)' : ''}
              </label>
              <input
                className="input"
                type="password"
                required={mode === 'create'}
                minLength={mode === 'create' || form.password ? 8 : undefined}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={mode === 'edit' ? 'Leave blank to keep current' : undefined}
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving
                  ? mode === 'create'
                    ? 'Creating…'
                    : 'Saving…'
                  : mode === 'create'
                    ? 'Create user'
                    : 'Save changes'}
              </button>
              <button type="button" className="btn-secondary" onClick={closeForm} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <div className="table-shell">
          <table className="min-w-full text-left text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                    No users yet. Add your first teammate to start assigning leads.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-900">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium text-slate-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${
                          user.role === 'admin'
                            ? 'bg-slate-900 text-white'
                            : 'bg-teal-50 text-teal-900'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        className="btn-secondary px-3 py-1.5 text-xs"
                        onClick={() => openEdit(user)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </RequireAuth>
  );
}
