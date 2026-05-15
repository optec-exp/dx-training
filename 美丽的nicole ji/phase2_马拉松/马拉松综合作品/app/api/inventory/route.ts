import { NextResponse } from "next/server";

export async function GET() {
  const url = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1/records.json?app=${process.env.KINTONE_APP_ID}`;
  const res = await fetch(url, {
    headers: { "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN! },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ error: "Kintone 获取失败" }, { status: 500 });

  const data = await res.json();
  type KintoneRecord = Record<string, { value: string }>;

  // 过滤库存不足的商品（current_stock < min_stock）
  const items = data.records
    .filter((r: KintoneRecord) => {
      const current = parseFloat(r.current_stock?.value ?? "0");
      const min = parseFloat(r.min_stock?.value ?? "0");
      return current < min;
    })
    .map((r: KintoneRecord) => {
      const current = parseFloat(r.current_stock?.value ?? "0");
      const min = parseFloat(r.min_stock?.value ?? "0");
      return {
        item_code: r.item_code?.value ?? "",
        item_name: r.item_name?.value ?? "",
        current_stock: current,
        min_stock: min,
        unit: r.unit?.value ?? "個",
        shortage: Math.ceil(min - current),
      };
    })
    .sort((a: { current_stock: number }, b: { current_stock: number }) => a.current_stock - b.current_stock);

  return NextResponse.json({ items });
}
