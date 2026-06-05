import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { 期间, cn, jp } = (await req.json()) as { 期间: string; cn: number; jp: number };
    if (!/^\d{4}-\d{2}$/.test(期间)) return NextResponse.json({ error: "期间格式 YYYY-MM" }, { status: 400 });
    const sb = getSupabaseAdmin();
    await sb.from("headcounts").delete().eq("期间", 期间).in("部门小组", ["JP DESK中国", "JP DESK日本"]);
    const { error } = await sb.from("headcounts").insert([
      { 期间, 部门小组: "JP DESK中国", region: "中国", 人数: Number(cn) || 0, 来源: "手工" },
      { 期间, 部门小组: "JP DESK日本", region: "日本", 人数: Number(jp) || 0, 来源: "手工" },
    ]);
    if (error) throw new Error(error.message);
    await logAudit("人数录入", "headcount", 期间, { 期间, cn, jp });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
