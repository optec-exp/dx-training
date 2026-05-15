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

  // 诊断：返回实际字段名
  type KintoneRecord = Record<string, { value: string }>;
  const allRecords: KintoneRecord[] = data.records ?? [];
  const sampleFields = allRecords[0] ? Object.keys(allRecords[0]) : [];
  const withDate = allRecords.filter(r => r.flight_date?.value);
  if (withDate.length === 0) {
    return NextResponse.json({
      records: [],
      debug: { total: allRecords.length, fields: sampleFields },
    });
  }

  const records = withDate
    .map((r: KintoneRecord) => {
      const flightDate = new Date(r.flight_date.value);
      const diffMs = flightDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return {
        case_no: r.case_no?.value ?? "",
        case_name: r.item?.value ?? "",
        client: r.client?.value ?? "",
        assignee: r.assignee?.value ?? "",
        note: r.note?.value ?? "",
        payment_date: r.flight_date?.value?.slice(0, 10) ?? "",
        amount: "",
        days_left: daysLeft,
      };
    })
    .filter((r: { days_left: number }) => r.days_left <= days)
    .sort((a: { days_left: number }, b: { days_left: number }) => a.days_left - b.days_left);

  return NextResponse.json({ records });
}
