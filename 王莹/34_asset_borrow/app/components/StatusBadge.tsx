import { ASSET_STATUS, type AssetStatus } from '@/lib/supabase';

export function StatusBadge({ status }: { status: AssetStatus }) {
  const conf = ASSET_STATUS[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${conf.color}`}
    >
      {conf.label}
    </span>
  );
}
