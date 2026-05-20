import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ItemStatus = "可用" | "借出中" | "维修中" | "报废";

export type Item = {
  id: number;
  created_at: string;
  name: string;
  category: string | null;
  code: string | null;
  status: ItemStatus;
  borrow_history?: BorrowHistory[];
};

export type BorrowHistory = {
  id: number;
  created_at: string;
  item_id: number;
  borrower: string;
  borrowed_at: string;
  returned_at: string | null;
  notes: string | null;
};
