import { NextRequest, NextResponse } from "next/server";
import { syncCases, syncSga } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { type, month } = (await req.json()) as { type: string; month: string };
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "month 格式应为 YYYY-MM" }, { status: 400 });
    }
    const result: Record<string, unknown> = { ok: true, month };
    if (type === "cases" || type === "all") result.cases = await syncCases(month);
    if (type === "sga" || type === "all") result.sga = await syncSga(month);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
