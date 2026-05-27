import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const RECEIPT_BUCKET = 'expense-receipts';

export const CATEGORY_LABELS: Record<string, string> = {
  business_activity: '业务活动费',
  business_maintenance: '业务维持费',
  hr_it_investment: '人才与IT投资',
  labor_cost: '人工费',
  tax: '税费',
};

export const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  submitted: '申请中',
  reviewing: '审批中',
  approved: '完成',
  rejected: '拒绝',
};

export type ExpenseApplication = {
  id: string;
  applicant_name: string;
  category: string;
  amount: number;
  summary: string;
  receipt_url: string | null;
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
  applied_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ExpenseStatusHistory = {
  id: string;
  application_id: string;
  from_status: string | null;
  to_status: string;
  operator_name: string;
  comment: string | null;
  created_at: string;
};

export type MonthlySummaryRow = {
  month: string;
  category: string;
  application_count: number;
  total_amount: number;
};
