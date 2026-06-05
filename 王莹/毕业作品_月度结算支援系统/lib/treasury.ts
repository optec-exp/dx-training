import { getSupabaseAdmin } from "./supabase-server";

export interface AgingReport {
  total: number;
  overdueAmt: number;
  overdueCount: number;
  count: number;
  buckets: { bucket: string; amt: number; count: number }[];
  topCustomers: { name: string; amt: number }[];
}

const BUCKET_ORDER = ["0-30", "31-60", "61-90", "90+"];

export async function getReceivablesAging(): Promise<AgingReport> {
  const sb = getSupabaseAdmin();
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("ar_ap_aging").select("*").eq("类型", "应收").range(from, from + 999);
    if (error) throw new Error(`读取 ar_ap_aging 失败: ${error.message}`);
    rows.push(...((data ?? []) as Record<string, unknown>[]));
    if (!data || data.length < 1000) break;
  }
  const bk = new Map<string, { amt: number; count: number }>();
  const cust = new Map<string, number>();
  let total = 0, overdueAmt = 0, overdueCount = 0;
  for (const r of rows) {
    const amt = Number(r["金额"]) || 0;
    const bucket = String(r["账龄桶"]);
    const over = r["是否超期"] === true;
    total += amt;
    if (over) { overdueAmt += amt; overdueCount++; }
    const b = bk.get(bucket) || { amt: 0, count: 0 }; b.amt += amt; b.count++; bk.set(bucket, b);
    const cname = String(r["客户供应商"] || "(未知)"); cust.set(cname, (cust.get(cname) || 0) + amt);
  }
  return {
    total, overdueAmt, overdueCount, count: rows.length,
    buckets: BUCKET_ORDER.map((bucket) => ({ bucket, amt: bk.get(bucket)?.amt || 0, count: bk.get(bucket)?.count || 0 })),
    topCustomers: [...cust].map(([name, amt]) => ({ name, amt })).sort((a, b) => b.amt - a.amt).slice(0, 10),
  };
}
