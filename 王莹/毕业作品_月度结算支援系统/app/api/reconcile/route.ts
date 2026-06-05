import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { parseBillPdf, parseBillText } from "@/lib/gemini";
import { reconcileBill, persistReconciliation, uploadBillFile } from "@/lib/reconcile";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function excelToText(buf: Buffer): string {
  const wb = XLSX.read(buf, { type: "buffer" });
  return wb.SheetNames.map((n) => XLSX.utils.sheet_to_csv(wb.Sheets[n])).join("\n").slice(0, 20000);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    const single = form.get("file");
    if (single instanceof File) files.push(single);
    const month = (form.get("month") as string) || "";
    if (files.length === 0) return NextResponse.json({ error: "请上传账单文件" }, { status: 400 });
    if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "month 格式应为 YYYY-MM" }, { status: 400 });

    const results = [];
    for (const file of files) {
      try {
        const buf = Buffer.from(await file.arrayBuffer());
        const isExcel = /\.xlsx?$/i.test(file.name) || file.type.includes("sheet") || file.type.includes("excel");
        const bill = isExcel ? await parseBillText(excelToText(buf)) : await parseBillPdf(buf.toString("base64"));
        const result = await reconcileBill(bill);
        const ext = isExcel ? "xlsx" : "pdf";
        const mime = isExcel ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/pdf";
        const filePath = await uploadBillFile(buf, bill.供应商, month, ext, mime);
        await persistReconciliation(bill, result, month, filePath);
        results.push({ filename: file.name, bill: { 供应商: bill.供应商, 币种: bill.币种, 类型: bill.类型, 行数: bill.lines.length }, result });
      } catch (e) {
        results.push({ filename: file.name, error: e instanceof Error ? e.message : String(e) });
      }
    }
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
