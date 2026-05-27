import { STATUS_LABELS } from '@/lib/supabase';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-300',
  submitted: 'bg-blue-100 text-blue-700 border-blue-300',
  reviewing: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved: 'bg-green-100 text-green-700 border-green-300',
  rejected: 'bg-red-100 text-red-700 border-red-300',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700 border-gray-300';
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span className={`inline-block border rounded px-2 py-0.5 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}
