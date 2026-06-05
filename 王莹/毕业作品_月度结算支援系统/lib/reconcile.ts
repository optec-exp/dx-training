import { getSupabaseAdmin } from "./supabase-server";
import type { ParsedBill } from "./gemini";

// 对账：账单 vs Kintone 成本(kc_cost_lines)，按 OPT + 供应商(模糊) + 币种 聚合比对。
export type ReconStatus = "匹配" | "金额差异" | "缺账单或漏录";
export interface ReconRow {
  opt_no: string;
  供应商: string;
  币种: string;
  billAmount: number;
  kintoneAmount: number | null;
  diff: number | null;
  status: ReconStatus;
}
export interface ReconResult {
  供应商: string;
  币种: string;
  rows: ReconRow[];
  summary: { matched: number; diff: number; missing: number; total: number };
}

const latin = (s: string) => (s || "").toUpperCase().replace(/[^A-Z]/g, "");
const TOLERANCE = 1;

export async function reconcileBill(bill: ParsedBill): Promise<ReconResult> {
  // 账单侧按 OPT 聚合
  const billByOpt = new Map<string, number>();
  for (const ln of bill.lines) billByOpt.set(ln.opt_no, (billByOpt.get(ln.opt_no) || 0) + ln.金额);
  const opts = [...billByOpt.keys()];

  // Kintone 侧：这些 OPT、同币种的成本明细
  const sb = getSupabaseAdmin();
  const kc: { opt_no: string; 供应商: string; 金额_原币: number }[] = [];
  for (let i = 0; i < opts.length; i += 100) {
    const { data, error } = await sb
      .from("kc_cost_lines")
      .select("opt_no,供应商,金额_原币")
      .in("opt_no", opts.slice(i, i + 100))
      .eq("原币种", bill.币种);
    if (error) throw new Error(`读取 kc_cost_lines 失败: ${error.message}`);
    kc.push(...((data ?? []) as typeof kc));
  }

  // Kintone 侧按 OPT 聚合（供应商模糊匹配账单供应商）
  const billLatin = latin(bill.供应商);
  const kinByOpt = new Map<string, number>();
  for (const r of kc) {
    const kl = latin(r.供应商);
    if (kl && (kl.includes(billLatin) || billLatin.includes(kl)))
      kinByOpt.set(r.opt_no, (kinByOpt.get(r.opt_no) || 0) + Number(r.金额_原币));
  }

  const rows: ReconRow[] = [];
  let matched = 0, diffN = 0, missing = 0;
  for (const [opt, bAmt] of billByOpt) {
    const kAmt = kinByOpt.get(opt) ?? null;
    let status: ReconStatus;
    let diff: number | null = null;
    if (kAmt == null) { status = "缺账单或漏录"; missing++; }
    else {
      diff = bAmt - kAmt;
      if (Math.abs(diff) < TOLERANCE) { status = "匹配"; matched++; }
      else { status = "金额差异"; diffN++; }
    }
    rows.push({ opt_no: opt, 供应商: bill.供应商, 币种: bill.币种, billAmount: bAmt, kintoneAmount: kAmt, diff, status });
  }
  rows.sort((a, b) => (a.status === "匹配" ? 1 : 0) - (b.status === "匹配" ? 1 : 0));
  return { 供应商: bill.供应商, 币种: bill.币种, rows, summary: { matched, diff: diffN, missing, total: billByOpt.size } };
}

// 持久化对账结果（bills + bill_lines + reconciliations）。
export async function persistReconciliation(bill: ParsedBill, result: ReconResult, month: string): Promise<void> {
  const sb = getSupabaseAdmin();
  const { data: billRow, error: be } = await sb
    .from("bills")
    .insert({ 类型: bill.类型, 供应商: bill.供应商, 账单日期: bill.账单日期 || null, 原币种: bill.币种, 账单总额_原币: bill.lines.reduce((s, l) => s + l.金额, 0), 利润月: month, 解析状态: "已解析" })
    .select("id").single();
  if (be) throw new Error(`写 bills 失败: ${be.message}`);
  const billId = (billRow as { id: string }).id;

  await sb.from("bill_lines").insert(bill.lines.map((l) => ({ bill_id: billId, opt_no: l.opt_no, 供应商: bill.供应商, 原币种: bill.币种, 金额_原币: l.金额, 匹配状态: "已对账" })));
  await sb.from("reconciliations").insert(result.rows.map((r) => ({ opt_no: r.opt_no, 供应商: r.供应商, kintone金额_原币: r.kintoneAmount, 账单金额_原币: r.billAmount, 差额: r.diff, 差异类型: r.status === "匹配" ? "匹配" : r.status === "金额差异" ? "金额差异" : "缺账单", 状态: r.status === "匹配" ? "已解决" : "待复核", 利润月: month })));
}
