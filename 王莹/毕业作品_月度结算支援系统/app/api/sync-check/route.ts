import { NextRequest, NextResponse } from "next/server";
import { getSyncCheck } from "@/lib/sync-check-data";
import { getSyncCheckDetail } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const opt = req.nextUrl.searchParams.get("opt");
  if (opt) return NextResponse.json({ detail: await getSyncCheckDetail(opt) });
  const month = req.nextUrl.searchParams.get("month") || "";
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "month 格式应为 YYYY-MM" }, { status: 400 });
  return NextResponse.json(await getSyncCheck(month));
}
