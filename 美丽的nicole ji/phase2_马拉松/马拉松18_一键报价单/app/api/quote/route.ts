import { NextResponse } from "next/server";

interface QuoteItem {
  case_no: string;
  case_name: string;
  client: string;
  unit_price: number;
  qty: number;
  subtotal: number;
}

export async function POST(req: Request) {
  const { quote_to, items, total, total_with_tax, valid_days } = await req.json() as {
    quote_to: string;
    items: QuoteItem[];
    total: number;
    total_with_tax: number;
    valid_days: number;
  };

  // Kintone の見積Appに保存（オプション）
  const kintoneUrl = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1/record.json`;
  const today = new Date().toISOString().slice(0, 10);

  const record = {
    quote_to: { value: quote_to },
    quote_date: { value: today },
    total_amount: { value: String(total_with_tax) },
    items_json: { value: JSON.stringify(items) },
    valid_days: { value: String(valid_days) },
  };

  const res = await fetch(kintoneUrl, {
    method: "POST",
    headers: {
      "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ app: process.env.KINTONE_QUOTE_APP_ID ?? process.env.KINTONE_APP_ID, record }),
  });

  if (!res.ok) {
    // 保存失敗しても見積データは返す（印刷は続行可）
    return NextResponse.json({ saved: false, total, total_with_tax });
  }

  return NextResponse.json({ saved: true, total, total_with_tax });
}
