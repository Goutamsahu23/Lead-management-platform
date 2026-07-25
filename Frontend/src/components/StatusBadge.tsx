import { STATUS_LABELS, type LeadStatus } from '@/lib/types';

const STYLES: Record<LeadStatus, string> = {
  new: 'bg-sky-100 text-sky-800',
  contacted: 'bg-amber-100 text-amber-900',
  qualified: 'bg-teal-100 text-teal-900',
  won: 'bg-emerald-100 text-emerald-900',
  lost: 'bg-rose-100 text-rose-900',
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
