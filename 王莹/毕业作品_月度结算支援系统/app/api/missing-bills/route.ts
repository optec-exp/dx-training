import { NextRequest, NextResponse } from "next/server";
import { getMissingBills } from "@/lib/reconcile";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get("month") || "";
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "month 格式 YYYY-MM" }, { status: 400 });
  try { return NextResponse.json(await getMissingBills(month)); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
