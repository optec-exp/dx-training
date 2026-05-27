export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export type DueStatus = 'overdue' | 'today' | 'normal';

export function getDueStatus(expectedReturnAt: string): {
  status: DueStatus;
  daysOverdue: number;
} {
  const e = new Date(expectedReturnAt);
  const expectedDay = new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime();
  const n = new Date();
  const today = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  const diff = Math.round((today - expectedDay) / 86400000);

  if (diff > 0) return { status: 'overdue', daysOverdue: diff };
  if (diff === 0) return { status: 'today', daysOverdue: 0 };
  return { status: 'normal', daysOverdue: 0 };
}
