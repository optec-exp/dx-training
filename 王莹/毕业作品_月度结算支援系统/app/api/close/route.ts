import { NextRequest, NextResponse } from "next/server";
import { getCloseStatus, setCloseStatus, getSnapshot, detectPostCloseChange } from "@/lib/close";
import { logAudit, getRecentAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get("month") || "";
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "month 格式 YYYY-MM" }, { status: 400 });
  try {
    const status = await getCloseStatus(month);
    const 审计 = await getRecentAudit(15);
    const 快照 = await getSnapshot(month);
    const 变更 = await detectPostCloseChange(month);
    return NextResponse.json({ ...status, 审计, 快照, 变更 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const { month, 锁定状态 } = (await req.json()) as { month: string; 锁定状态: string };
    if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "month 格式 YYYY-MM" }, { status: 400 });
    if (!["进行中", "月结", "正式锁账"].includes(锁定状态)) return NextResponse.json({ error: "状态非法" }, { status: 400 });
    await setCloseStatus(month, 锁定状态);
    await logAudit(`关账→${锁定状态}`, "close_period", month, { 期间: month, 锁定状态 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
