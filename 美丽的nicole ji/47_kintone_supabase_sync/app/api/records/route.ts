import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// 使用 service_role_key，绕开 RLS，服务端专用
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/records
// body: { ids?: string[], limit?: number }
//   - ids 有值 → 按指定 kintone_id 查询
//   - ids 为空 → 查最新 limit 条
export async function POST(req: Request) {
  try {
    const body = await req.json() as { ids?: string[]; limit?: number };
    const { ids, limit = 200 } = body;

    const query = supabase.from("kintone_records").select("*");

    const { data, error } = ids?.length
      ? await query.in("kintone_id", ids)
      : await query.order("synced_at", { ascending: false }).limit(limit);

    if (error) throw error;

    return NextResponse.json({ records: data ?? [] });

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "未知错误" },
      { status: 500 }
    );
  }
}
