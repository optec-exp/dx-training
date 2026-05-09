import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") ?? 3);
  const now = new Date();

  const url = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1/records.json?app=${process.env.KINTONE_APP_ID}`;
  const res = await fetch(url, {
    headers: { "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN! },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ error: "Kintone 获取失败" }, { status: 500 });

  const data = await res.json();
  type KintoneRecord = Record<string, { value: string }>;

  const records = data.records
    .filter((r: KintoneRecord) => {
      // 只检查未完了的案件
      const status = r.status?.value ?? "";
      if (status === "完了" || status === "クローズ") return false;
      // 使用 updated_at 或 Kintone 内建 $updated_time
      const updated = r.updated_at?.value ?? r.$updated_time?.value ?? "";
      if (!updated) return false;
      const updatedDate = new Date(updated);
      const staleDays = (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);
      return staleDays > days;
    })
    .map((r: KintoneRecord) => {
      const updated = r.updated_at?.value ?? r.$updated_time?.value ?? "";
      const updatedDate = new Date(updated);
      const staleDays = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        case_no: r.case_no?.value ?? "",
        case_name: r.case_name?.value ?? "",
        client: r.client?.value ?? "",
        assignee: r.assignee?.value ?? "",
        last_updated: updated ? updated.slice(0, 10) : "",
        stale_days: staleDays,
        status: r.status?.value ?? "",
      };
    })
    .sort((a: { stale_days: number }, b: { stale_days: number }) => b.stale_days - a.stale_days);

  return NextResponse.json({ records });
}
