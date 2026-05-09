import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slaHours = Number(searchParams.get("hours") ?? 24);
  const now = new Date();

  const url = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1/records.json?app=${process.env.KINTONE_APP_ID}`;
  const res = await fetch(url, {
    headers: { "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN! },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ error: "Kintone 获取失败" }, { status: 500 });

  const data = await res.json();
  type KintoneRecord = Record<string, { value: string }>;

  // 过滤：未完了 且 受付时间超过SLA时限
  const records = data.records
    .filter((r: KintoneRecord) => {
      const status = r.status?.value ?? "";
      // 完了案件不计入违规
      if (status === "完了" || status === "クローズ") return false;
      const created = r.created_at?.value ?? r.$created_time?.value ?? "";
      if (!created) return false;
      const createdDate = new Date(created);
      const elapsedHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
      return elapsedHours > slaHours;
    })
    .map((r: KintoneRecord) => {
      const created = r.created_at?.value ?? r.$created_time?.value ?? "";
      const createdDate = new Date(created);
      const elapsedHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
      return {
        case_no: r.case_no?.value ?? "",
        case_name: r.case_name?.value ?? "",
        client: r.client?.value ?? "",
        assignee: r.assignee?.value ?? "",
        created_at: created ? created.slice(0, 16).replace("T", " ") : "",
        overdue_hours: elapsedHours - slaHours,
        status: r.status?.value ?? "",
      };
    })
    .sort((a: { overdue_hours: number }, b: { overdue_hours: number }) => b.overdue_hours - a.overdue_hours);

  return NextResponse.json({ records });
}
