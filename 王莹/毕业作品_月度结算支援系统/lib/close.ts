import { getSupabaseAdmin } from "./supabase-server";
import { getCasesForMonth } from "./data";
import { computeProfitReport } from "./profit";
import { getSgaForMonth } from "./sga";
import { getJpdeskHeads } from "./headcount";

export interface CloseStatus {
  month: string;
  对账: { total: number; matched: number; 差异: number; 缺账单: number };
  同步差异: number;
  锁定状态: string;
  正式锁账日: string;
}

// M 月 → M+2 月 1 日（宽限 1 个月）。
function lockDate(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const total = m + 2;
  const ny = y + Math.floor((total - 1) / 12);
  const nm = ((total - 1) % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}-01`;
}

export async function getCloseStatus(month: string): Promise<CloseStatus> {
  const sb = getSupabaseAdmin();
  const recon = { total: 0, matched: 0, 差异: 0, 缺账单: 0 };
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("reconciliations").select("差异类型").eq("利润月", month).range(from, from + 999);
    const rows = (data ?? []) as Record<string, unknown>[];
    for (const r of rows) {
      recon.total++;
      const t = String(r["差异类型"]);
      if (t === "匹配") recon.matched++;
      else if (t === "金额差异") recon.差异++;
      else recon.缺账单++;
    }
    if (rows.length < 1000) break;
  }
  const { count } = await sb.from("sync_checks").select("*", { count: "exact", head: true }).eq("利润月", month).eq("状态", "差异");
  const { data: cp } = await sb.from("close_periods").select("锁定状态").eq("利润月", month).limit(1);
  const 锁定状态 = (cp && cp[0] ? String((cp[0] as Record<string, unknown>)["锁定状态"]) : "进行中");
  return { month, 对账: recon, 同步差异: count ?? 0, 锁定状态, 正式锁账日: lockDate(month) };
}

export async function setCloseStatus(month: string, 锁定状态: string): Promise<void> {
  const sb = getSupabaseAdmin();
  const now = new Date().toISOString();
  await sb.from("close_periods").delete().eq("利润月", month).eq("company", "全社");
  await sb.from("close_periods").insert({
    利润月: month, company: "全社", 锁定状态,
    软关账时间: 锁定状态 === "月结" ? now : null,
    锁账时间: 锁定状态 === "正式锁账" ? now : null,
    正式锁账日: lockDate(month),
  });

  // 正式锁账 → 快照冻结（保证历史报表可复现）
  if (锁定状态 === "正式锁账") {
    try {
      const cases = await getCasesForMonth(month);
      const r = computeProfitReport(cases, month, await getJpdeskHeads(month));
      const s = await getSgaForMonth(month);
      const 聚合快照 = {
        冻结时间: now, 案件数: r.caseCount,
        全社: { 毛利: r.total, 贩管费: s.total, 净利: r.total - s.total },
        中国: { 毛利: r.china, 贩管费: s.china, 净利: r.china - s.china },
        日本: { 毛利: r.japan, 贩管费: s.japan, 净利: r.japan - s.japan },
      };
      await sb.from("period_snapshots").delete().eq("利润月", month).eq("company", "全社");
      await sb.from("period_snapshots").insert({ 利润月: month, company: "全社", 聚合快照 });
    } catch { /* 快照失败不阻断锁账 */ }
  }
}

export async function getSnapshot(month: string): Promise<Record<string, unknown> | null> {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("period_snapshots").select("聚合快照,冻结时间").eq("利润月", month).eq("company", "全社").limit(1);
  return data && data[0] ? (data[0] as Record<string, unknown>) : null;
}
