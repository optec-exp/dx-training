import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// 异常下钻：返回某 OPT 的成本明细 + 案件概要
export async function GET(req: NextRequest) {
  try {
    const opt = new URL(req.url).searchParams.get("opt");
    if (!opt) throw new Error("缺少 opt");
    const sb = getSupabaseAdmin();
    const { data: lines } = await sb.from("kc_cost_lines").select("供应商,费用科目,原币种,金额_原币,金额_日元").eq("opt_no", opt).order("金额_日元", { ascending: false });
    const { data: cs } = await sb.from("kc_cases").select("顾客,business_scope,服务类型,売上_日元,成本_日元,毛利_日元").eq("opt_no", opt).limit(1);
    return NextResponse.json({ lines: lines ?? [], case: (cs ?? [])[0] ?? null });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
