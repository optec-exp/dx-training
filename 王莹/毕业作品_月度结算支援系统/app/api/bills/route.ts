import { NextRequest, NextResponse } from "next/server";
import { getUploadedBills, getCostLinesByOpt } from "@/lib/reconcile";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const opt = req.nextUrl.searchParams.get("opt");
  if (opt) return NextResponse.json({ lines: await getCostLinesByOpt(opt) });
  const month = req.nextUrl.searchParams.get("month") || undefined;
  return NextResponse.json({ rows: await getUploadedBills(month) });
}
