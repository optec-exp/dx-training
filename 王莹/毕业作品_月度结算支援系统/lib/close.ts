import { getSupabaseAdmin } from "./supabase-server";
import { getCasesForMonth } from "./data";
import { computeProfitReport } from "./profit";
import { getSgaForMonth } from "./sga";
import { getJpdeskHeads } from "./headcount";

export interface CloseStatus {
  month: string;
  对账: { total: number; matched: number; 差异: number; 缺账单: number };
  同步差异: number;
  齐全: boolean;
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

// 当期聚合（快照基线 + 锁后变更侦测 共用）
interface Aggregate { 案件数: number; 全社: { 毛利: number; 贩管费: number; 净利: number }; 中国: { 毛利: number; 贩管费: number; 净利: number }; 日本: { 毛利: number; 贩管费: number; 净利: number } }
async function computeAggregate(month: string): Promise<Aggregate> {
  const cases = await getCasesForMonth(month);
  const r = computeProfitReport(cases, month, await getJpdeskHeads(month));
  const s = await getSgaForMonth(month);
  return {
    案件数: r.caseCount,
    全社: { 毛利: Math.round(r.total), 贩管费: Math.round(s.total), 净利: Math.round(r.total - s.total) },
    中国: { 毛利: Math.round(r.china), 贩管费: Math.round(s.china), 净利: Math.round(r.china - s.china) },
    日本: { 毛利: Math.round(r.japan), 贩管费: Math.round(s.japan), 净利: Math.round(r.japan - s.japan) },
  };
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
  return { month, 对账: recon, 同步差异: count ?? 0, 齐全: recon.缺账单 === 0 && recon.差异 === 0, 锁定状态, 正式锁账日: lockDate(month) };
}

// 月结门禁：缺账单/金额差异未清零，不允许月结。
export async function setCloseStatus(month: string, 锁定状态: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (锁定状态 === "月结" || 锁定状态 === "正式锁账") {
    const st = await getCloseStatus(month);
    if (!st.齐全) throw new Error(`关账门禁未通过：尚有 ${st.对账.缺账单} 笔缺账单/漏录、${st.对账.差异} 笔金额差异未清，不能月结/关账`);
  }
  const now = new Date().toISOString();
  await sb.from("close_periods").delete().eq("利润月", month).eq("company", "全社");
  await sb.from("close_periods").insert({
    利润月: month, company: "全社", 锁定状态,
    软关账时间: 锁定状态 === "月结" ? now : null,
    锁账时间: 锁定状态 === "正式锁账" ? now : null,
    正式锁账日: lockDate(month),
  });

  // 关账（正式锁账）→ 冻结当期聚合快照（基线，保证历史报表可复现 + 供锁后变更侦测）
  if (锁定状态 === "正式锁账") {
    try {
      const agg = await computeAggregate(month);
      const 聚合快照 = { 冻结时间: now, ...agg };
      await sb.from("period_snapshots").delete().eq("利润月", month).eq("company", "全社");
      await sb.from("period_snapshots").insert({ 利润月: month, company: "全社", 聚合快照 });
    } catch { /* 快照失败不阻断关账 */ }
  }
}

export async function getSnapshot(month: string): Promise<Record<string, unknown> | null> {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("period_snapshots").select("聚合快照,冻结时间").eq("利润月", month).eq("company", "全社").limit(1);
  return data && data[0] ? (data[0] as Record<string, unknown>) : null;
}

// 锁后变更侦测：已关账(快照已冻结)后，对比 当前聚合 vs 冻结快照，列出变动项。
export interface ChangeDetection {
  已关账: boolean;
  冻结时间: string | null;
  changed: boolean;
  diffs: { 维度: string; 指标: string; 快照值: number; 当前值: number; 差额: number }[];
}
export async function detectPostCloseChange(month: string): Promise<ChangeDetection> {
  const sb = getSupabaseAdmin();
  const { data: cp } = await sb.from("close_periods").select("锁定状态").eq("利润月", month).limit(1);
  const 锁定状态 = cp && cp[0] ? String((cp[0] as Record<string, unknown>)["锁定状态"]) : "进行中";
  const snap = await getSnapshot(month);
  // 仅在「已正式锁账」且有快照基线时才做锁后变更侦测
  if (锁定状态 !== "正式锁账" || !snap) return { 已关账: false, 冻结时间: null, changed: false, diffs: [] };
  const frozen = snap["聚合快照"] as unknown as Aggregate & { 冻结时间: string };
  let cur: Aggregate;
  try { cur = await computeAggregate(month); } catch { return { 已关账: true, 冻结时间: frozen?.冻结时间 ?? null, changed: false, diffs: [] }; }
  const diffs: ChangeDetection["diffs"] = [];
  for (const 维度 of ["全社", "中国", "日本"] as const) {
    for (const 指标 of ["毛利", "贩管费", "净利"] as const) {
      const a = (frozen[维度]?.[指标] as number) || 0, b = (cur[维度]?.[指标] as number) || 0;
      if (Math.abs(a - b) > 1) diffs.push({ 维度, 指标, 快照值: a, 当前值: b, 差额: b - a });
    }
  }
  return { 已关账: true, 冻结时间: frozen?.冻结时间 ?? null, changed: diffs.length > 0, diffs };
}
