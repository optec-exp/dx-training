import { NextRequest, NextResponse } from "next/server";
import { getPendingReconciliations, setReviewStatus } from "@/lib/reconcile";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get("month") || undefined;
  return NextResponse.json({ rows: await getPendingReconciliations(month) });
}

export async function POST(req: NextRequest) {
  try {
    const { id, 状态 } = (await req.json()) as { id: string; 状态: string };
    if (!id || !状态) return NextResponse.json({ error: "缺少 id/状态" }, { status: 400 });
    await setReviewStatus(id, 状态);
    await logAudit(`差异复核→${状态}`, "reconciliation", id, { id, 状态 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
