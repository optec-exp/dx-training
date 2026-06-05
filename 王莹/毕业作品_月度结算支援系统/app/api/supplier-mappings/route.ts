import { NextRequest, NextResponse } from "next/server";
import { getSupplierMappings, addSupplierMapping } from "@/lib/reconcile";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ rows: await getSupplierMappings() });
}

export async function POST(req: NextRequest) {
  try {
    const { 账单供应商, kintone供应商 } = (await req.json()) as { 账单供应商: string; kintone供应商: string };
    if (!账单供应商 || !kintone供应商) return NextResponse.json({ error: "请填写两侧供应商名" }, { status: 400 });
    await addSupplierMapping(账单供应商, kintone供应商);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
