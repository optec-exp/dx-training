import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// 标记坏账：从长期挂账移入坏账卡片（Kintone 无此功能，本系统维护）
export async function POST(req: NextRequest) {
  try {
    const b = (await req.json()) as Record<string, unknown>;
    const 客户 = String(b["客户"] || "").trim();
    if (!客户) throw new Error("缺少客户");
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("bad_debts").insert({ 客户, 金额: Number(b["金额"]) || 0, 备注: String(b["备注"] || "") });
    if (error) throw new Error(error.message);
    await logAudit("坏账标记", "bad_debt", 客户, b);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// 恢复：从坏账撤回（重新进入长期挂账）
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new Error("缺少 id");
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("bad_debts").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await logAudit("坏账恢复", "bad_debt", id, {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
