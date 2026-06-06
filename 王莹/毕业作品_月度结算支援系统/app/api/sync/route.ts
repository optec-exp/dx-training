import { NextRequest, NextResponse } from "next/server";
import { syncCases, syncSga, syncCheck, syncBank, syncSettlementCash, syncAging } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { type, month, refDate } = (await req.json()) as { type: string; month: string; refDate?: string };
    // ⑦账龄用基准日(非月份)
    if (type === "aging") {
      const rd = /^\d{4}-\d{2}-\d{2}$/.test(refDate || "") ? refDate! : new Date().toISOString().slice(0, 10);
      return NextResponse.json({ ok: true, aging: await syncAging(rd), refDate: rd });
    }
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "month 格式应为 YYYY-MM" }, { status: 400 });
    }
    const result: Record<string, unknown> = { ok: true, month };
    if (type === "cases" || type === "all") result.cases = await syncCases(month);
    if (type === "sga" || type === "all") result.sga = await syncSga(month);
    if (type === "check" || type === "all") result.check = await syncCheck(month); // ④同步排查(依赖案件已同步)
    if (type === "bank" || type === "settlement" || type === "all") result.bank = await syncBank(month); // ⑥银行残高
    if (type === "settlement" || type === "all") result.settlement = await syncSettlementCash(month); // ⑥现金勾稽(依赖银行残高)
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
