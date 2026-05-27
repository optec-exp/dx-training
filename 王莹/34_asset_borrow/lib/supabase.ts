import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const ASSET_STATUS = {
  available: { label: '可用', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  borrowed: { label: '借出中', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  repairing: { label: '维修中', color: 'bg-sky-100 text-sky-700 border-sky-300' },
  scrapped: { label: '报废', color: 'bg-zinc-200 text-zinc-600 border-zinc-400' },
} as const;

export type AssetStatus = keyof typeof ASSET_STATUS;

export const ASSET_CATEGORIES = ['PC', '显示器', '办公设备', '其他'] as const;
export type AssetCategory = typeof ASSET_CATEGORIES[number];

export type Item = {
  id: string;
  name: string;
  category: AssetCategory;
  asset_code: string;
  status: AssetStatus;
  created_at: string;
};

export type BorrowRecord = {
  id: string;
  item_id: string;
  borrower_name: string;
  borrowed_at: string;
  expected_return_at: string;
  returned_at: string | null;
  note: string | null;
};
