import { getSupabaseAdmin } from "./supabase-server";
import type { ParsedBill } from "./gemini";

// 对账：账单 vs Kintone 成本(kc_cost_lines)。
// 一级：OPT+供应商(模糊)+币种；二级兜底(无供应商名)：OPT+币种 内按金额找唯一匹配。
export type ReconStatus = "匹配" | "金额差异" | "缺账单或漏录" | "待人工核对";
export interface ReconRow {
  opt_no: string;
  供应商: string;
  kintone供应商: string | null; // 实际匹配到的 Kintone 供应商（兜底推定时有用）
  币种: string;
  billAmount: number;
  kintoneAmount: number | null;
  diff: number | null;
  status: ReconStatus;
  note?: string;
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

  // Kintone 侧：这些 OPT、同币种的成本明细（保留单行，供两级匹配）
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
  const kcByOpt = new Map<string, { 供应商: string; 金额: number }[]>();
  for (const r of kc) {
    const arr = kcByOpt.get(r.opt_no) || [];
    arr.push({ 供应商: r.供应商, 金额: Number(r.金额_原币) });
    kcByOpt.set(r.opt_no, arr);
  }

  const billLatin = latin(bill.供应商);
  const rows: ReconRow[] = [];
  let matched = 0, diffN = 0, missing = 0, manual = 0;
  for (const [opt, bAmt] of billByOpt) {
    const lines = kcByOpt.get(opt) || [];
    let row: ReconRow;

    // 一级：供应商模糊匹配
    const supLines = billLatin ? lines.filter((l) => { const kl = latin(l.供应商); return kl && (kl.includes(billLatin) || billLatin.includes(kl)); }) : [];
    if (supLines.length) {
      const kAmt = supLines.reduce((s, l) => s + l.金额, 0);
      const diff = bAmt - kAmt;
      const ok = Math.abs(diff) < TOLERANCE;
      row = { opt_no: opt, 供应商: bill.供应商, kintone供应商: supLines[0].供应商, 币种: bill.币种, billAmount: bAmt, kintoneAmount: kAmt, diff, status: ok ? "匹配" : "金额差异" };
      if (ok) matched++; else diffN++;
    } else {
      // 二级兜底：按金额在该 OPT+币种 内找唯一匹配
      const hit = lines.filter((l) => Math.abs(l.金额 - bAmt) < TOLERANCE);
      if (hit.length === 1) {
        row = { opt_no: opt, 供应商: bill.供应商, kintone供应商: hit[0].供应商, 币种: bill.币种, billAmount: bAmt, kintoneAmount: hit[0].金额, diff: 0, status: "匹配", note: "按金额匹配，供应商推定" };
        matched++;
      } else if (hit.length > 1) {
        row = { opt_no: opt, 供应商: bill.供应商, kintone供应商: null, 币种: bill.币种, billAmount: bAmt, kintoneAmount: null, diff: null, status: "待人工核对", note: `${hit.length} 笔同额候选` };
        manual++;
      } else {
        row = { opt_no: opt, 供应商: bill.供应商, kintone供应商: null, 币种: bill.币种, billAmount: bAmt, kintoneAmount: null, diff: null, status: "缺账单或漏录", note: lines.length ? "该票同币种成本无金额匹配" : "该票该币种无成本" };
        missing++;
      }
    }
    rows.push(row);
  }
  const order: Record<ReconStatus, number> = { 金额差异: 0, 待人工核对: 1, 缺账单或漏录: 2, 匹配: 3 };
  rows.sort((a, b) => order[a.status] - order[b.status]);
  return { 供应商: bill.供应商, 币种: bill.币种, rows, summary: { matched, diff: diffN, missing: missing + manual, total: billByOpt.size } };
}

export interface PendingRecon { id: string; opt_no: string; 供应商: string; 账单金额_原币: number; kintone金额_原币: number | null; 差额: number | null; 差异类型: string; 状态: string; 利润月: string }
export async function getPendingReconciliations(month?: string): Promise<PendingRecon[]> {
  const sb = getSupabaseAdmin();
  let q = sb.from("reconciliations").select("*").neq("差异类型", "匹配").order("利润月", { ascending: false });
  if (month) q = q.eq("利润月", month);
  const { data } = await q.limit(200);
  return (data ?? []) as unknown as PendingRecon[];
}
export async function setReviewStatus(id: string, 状态: string, 复核备注 = ""): Promise<void> {
  const sb = getSupabaseAdmin();
  await sb.from("reconciliations").update({ 状态, 复核备注, 复核人: "财务", updated_at: new Date().toISOString() }).eq("id", id);
}

// 持久化对账结果（bills + bill_lines + reconciliations）。
// 把账单 PDF 存入 Storage(settlement-bills)，返回存储路径（原件存档/内控留存）。
export async function uploadBillFile(base64: string, 供应商: string, month: string): Promise<string | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const safe = (供应商 || "bill").replace(/[^\w一-鿿]/g, "_").slice(0, 30);
    const path = `${month}/${safe}_${Date.now()}.pdf`;
    const res = await fetch(`${url}/storage/v1/object/settlement-bills/${encodeURIComponent(path)}`, {
      method: "POST",
      headers: { apikey: key as string, Authorization: `Bearer ${key}`, "Content-Type": "application/pdf" },
      body: Buffer.from(base64, "base64"),
    });
    return res.ok ? path : null;
  } catch { return null; }
}

export async function persistReconciliation(bill: ParsedBill, result: ReconResult, month: string, 原始文件URL: string | null = null): Promise<void> {
  const sb = getSupabaseAdmin();
  const { data: billRow, error: be } = await sb
    .from("bills")
    .insert({ 类型: bill.类型, 供应商: bill.供应商, 账单日期: bill.账单日期 || null, "原始文件url": 原始文件URL, 原币种: bill.币种, 账单总额_原币: bill.lines.reduce((s, l) => s + l.金额, 0), 利润月: month, 解析状态: "已解析" })
    .select("id").single();
  if (be) throw new Error(`写 bills 失败: ${be.message}`);
  const billId = (billRow as { id: string }).id;

  await sb.from("bill_lines").insert(bill.lines.map((l) => ({ bill_id: billId, opt_no: l.opt_no, 供应商: bill.供应商, 原币种: bill.币种, 金额_原币: l.金额, 匹配状态: "已对账" })));
  const typeMap: Record<string, string> = { 匹配: "匹配", 金额差异: "金额差异", 缺账单或漏录: "缺账单", 待人工核对: "无OPT待人工" };
  await sb.from("reconciliations").insert(result.rows.map((r) => ({ opt_no: r.opt_no, 供应商: r.kintone供应商 || r.供应商, kintone金额_原币: r.kintoneAmount, 账单金额_原币: r.billAmount, 差额: r.diff, 差异类型: typeMap[r.status], 状态: r.status === "匹配" ? "已解决" : "待复核", 利润月: month })));
}
