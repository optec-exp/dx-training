import { NextRequest, NextResponse } from "next/server";
import { parseBillPdf } from "@/lib/gemini";
import { reconcileBill, persistReconciliation, uploadBillFile } from "@/lib/reconcile";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const month = (form.get("month") as string) || "";
    if (!file) return NextResponse.json({ error: "请上传账单 PDF" }, { status: 400 });
    if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "month 格式应为 YYYY-MM" }, { status: 400 });

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const bill = await parseBillPdf(base64);
    const result = await reconcileBill(bill);
    const filePath = await uploadBillFile(base64, bill.供应商, month);
    await persistReconciliation(bill, result, month, filePath);

    return NextResponse.json({
      bill: { 供应商: bill.供应商, 币种: bill.币种, 类型: bill.类型, 行数: bill.lines.length },
      result,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
