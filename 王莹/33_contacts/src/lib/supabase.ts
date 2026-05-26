import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Contact = {
  id: number;
  name: string;
  department: string;
  position: string | null;
  email: string;
  phone: string | null;
  hire_date: string | null;
  birthday: string | null;
  avatar_url: string | null;
  company: string | null;
  office_location: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};
