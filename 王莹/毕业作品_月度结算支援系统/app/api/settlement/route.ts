import { NextRequest, NextResponse } from "next/server";
import { getSettlement, getCashRecon, getSettlementTrend } from "@/lib/settlement";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get("month") || "";
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "month 格式应为 YYYY-MM" }, { status: 400 });
  const [settlement, cash, trend] = await Promise.all([getSettlement(month), getCashRecon(month), getSettlementTrend()]);
  return NextResponse.json({ settlement, cash, trend });
}
