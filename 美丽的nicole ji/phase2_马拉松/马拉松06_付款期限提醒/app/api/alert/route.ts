import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") ?? 7);
  const today = new Date();

  const url = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1/records.json?app=${process.env.KINTONE_APP_ID}`;
  const res = await fetch(url, {
    headers: { "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN! },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ error: "Kintone 获取失败" }, { status: 500 });

  const data = await res.json();

  // 过滤付款日在阈值内（含逾期）的案件
  type KintoneRecord = Record<string, { value: string }>;
  const records = data.records
    .filter((r: KintoneRecord) => r.payment_date?.value)
    .map((r: KintoneRecord) => {
      const payDate = new Date(r.payment_date.value);
      const diffMs = payDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return {
        case_no: r.case_no?.value ?? "",
        case_name: r.case_name?.value ?? "",
        client: r.client?.value ?? "",
        payment_date: r.payment_date?.value?.slice(0, 10) ?? "",
        amount: r.amount?.value ?? "0",
        days_left: daysLeft,
      };
    })
    .filter((r: { days_left: number }) => r.days_left <= days)
    .sort((a: { days_left: number }, b: { days_left: number }) => a.days_left - b.days_left);

  return NextResponse.json({ records });
}
