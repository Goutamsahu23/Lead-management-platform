export type Role = 'admin' | 'member';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeadUserRef {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: Role;
}

export interface Lead {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  status: LeadStatus;
  assignedTo: LeadUserRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  _id: string;
  leadId: string;
  authorId: LeadUserRef;
  body: string;
  createdAt: string;
}

export interface Activity {
  _id: string;
  leadId: string;
  actorId: LeadUserRef | null;
  type: 'created' | 'status_changed' | 'assigned' | 'note_added';
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardStats {
  total: number;
  unassigned: number;
  statusCounts: Record<LeadStatus, number>;
}

export const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'won',
  'lost',
];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
};

export function refId(user: { id?: string; _id?: string } | null | undefined): string {
  if (!user) return '';
  return String(user.id || user._id || '');
}
