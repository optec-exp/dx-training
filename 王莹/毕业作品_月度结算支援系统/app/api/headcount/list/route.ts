import { NextResponse } from "next/server";
import { listHeadcounts } from "@/lib/headcount";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ rows: await listHeadcounts() });
  } catch (e) {
    return NextResponse.json({ rows: [], error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
