'use client';

import { ASSET_STATUS, type AssetStatus } from '@/lib/supabase';

export type StatusFilterValue = 'all' | AssetStatus;

type Props = {
  value: StatusFilterValue;
  onChange: (v: StatusFilterValue) => void;
  counts: Record<StatusFilterValue, number>;
};

const TABS: { value: StatusFilterValue; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'available', label: ASSET_STATUS.available.label },
  { value: 'borrowed', label: ASSET_STATUS.borrowed.label },
  { value: 'repairing', label: ASSET_STATUS.repairing.label },
  { value: 'scrapped', label: ASSET_STATUS.scrapped.label },
];

export function StatusFilter({ value, onChange, counts }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const active = value === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
              active
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {counts[tab.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
