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

// 供应商映射记忆：账单供应商 ↔ Kintone 供应商
export async function getSupplierMappings(): Promise<{ 账单供应商: string; kintone供应商: string }[]> {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("supplier_mappings").select("账单供应商,kintone供应商").limit(500);
  return (data ?? []) as { 账单供应商: string; kintone供应商: string }[];
}
export async function addSupplierMapping(账单供应商: string, kintone供应商: string): Promise<void> {
  if (!账单供应商 || !kintone供应商 || latin(账单供应商) === latin(kintone供应商)) return;
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("supplier_mappings").select("id").eq("账单供应商", 账单供应商).eq("kintone供应商", kintone供应商).limit(1);
  if (data && data.length) return; // 去重
  await sb.from("supplier_mappings").insert({ 账单供应商, kintone供应商 });
}

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
  // 供应商映射记忆：账单供应商 → 可接受的 Kintone 供应商(latin)
  const maps = await getSupplierMappings();
  const mappedLatins = new Set(maps.filter((m) => latin(m.账单供应商) === billLatin).map((m) => latin(m.kintone供应商)));
  const rows: ReconRow[] = [];
  let matched = 0, diffN = 0, missing = 0, manual = 0;
  for (const [opt, bAmt] of billByOpt) {
    const lines = kcByOpt.get(opt) || [];
    let row: ReconRow;

    // 一级：供应商模糊匹配 OR 映射记忆命中
    const supLines = billLatin ? lines.filter((l) => { const kl = latin(l.供应商); return kl && (kl.includes(billLatin) || billLatin.includes(kl) || mappedLatins.has(kl)); }) : [];
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

// 缺账单清单：该利润月 Kintone 成本(OPT+供应商) 中尚未匹配到账单的，按供应商分组。
export interface MissingGroup { 供应商: string; 笔数: number; 金额: number; 币种: string; items: { opt_no: string; 费用科目: string; 币种: string; 金额: number }[] }
export interface MissingReport { 齐全率: number; 成本行数: number; 缺账单行数: number; 缺账单金额: number; groups: MissingGroup[] }

export async function getMissingBills(month: string): Promise<MissingReport> {
  const sb = getSupabaseAdmin();
  // 该月案件 OPT
  const opts: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("kc_cases").select("opt_no").eq("利润月", month).range(from, from + 999);
    const rows = (data ?? []) as { opt_no: string }[];
    opts.push(...rows.map((r) => r.opt_no));
    if (rows.length < 1000) break;
  }
  if (opts.length === 0) return { 齐全率: 1, 成本行数: 0, 缺账单行数: 0, 缺账单金额: 0, groups: [] };

  // Kintone 成本明细
  const lines: { opt_no: string; 供应商: string; 费用科目: string; 原币种: string; 金额_原币: number }[] = [];
  for (let i = 0; i < opts.length; i += 100) {
    const { data } = await sb.from("kc_cost_lines").select("opt_no,供应商,费用科目,原币种,金额_原币").in("opt_no", opts.slice(i, i + 100));
    lines.push(...((data ?? []) as typeof lines));
  }
  // 已匹配账单的 (opt_no + 供应商latin)
  const { data: recon } = await sb.from("reconciliations").select("opt_no,供应商,差异类型").eq("利润月", month);
  const matched = new Set<string>();
  for (const r of (recon ?? []) as { opt_no: string; 供应商: string; 差异类型: string }[]) {
    if (r.差异类型 === "匹配" || r.差异类型 === "金额差异") matched.add(`${r.opt_no}|${latin(r.供应商)}`);
  }

  const grp = new Map<string, MissingGroup>();
  let 缺行 = 0, 缺额 = 0;
  for (const l of lines) {
    if (matched.has(`${l.opt_no}|${latin(l.供应商)}`)) continue;
    缺行++; 缺额 += Number(l.金额_原币) || 0;
    const g = grp.get(l.供应商) || { 供应商: l.供应商, 笔数: 0, 金额: 0, 币种: l.原币种, items: [] };
    g.笔数++; g.金额 += Number(l.金额_原币) || 0;
    if (g.items.length < 50) g.items.push({ opt_no: l.opt_no, 费用科目: l.费用科目, 币种: l.原币种, 金额: Number(l.金额_原币) || 0 });
    grp.set(l.供应商, g);
  }
  return {
    齐全率: lines.length ? (lines.length - 缺行) / lines.length : 1,
    成本行数: lines.length, 缺账单行数: 缺行, 缺账单金额: 缺额,
    groups: [...grp.values()].sort((a, b) => b.金额 - a.金额),
  };
}

// 已上传账单历史 + 原件签名链接
export interface UploadedBill { id: string; 供应商: string; 类型: string; 原币种: string; 账单总额_原币: number; 利润月: string; created_at: string; 原件链接: string | null }
export async function getUploadedBills(month?: string): Promise<UploadedBill[]> {
  const sb = getSupabaseAdmin();
  let q = sb.from("bills").select("*").order("created_at", { ascending: false }).limit(100);
  if (month) q = q.eq("利润月", month);
  const { data } = await q;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const out: UploadedBill[] = [];
  for (const b of (data ?? []) as Record<string, unknown>[]) {
    const path = b["原始文件url"] as string | null;
    let 原件链接: string | null = null;
    if (path) {
      try {
        const r = await fetch(`${url}/storage/v1/object/sign/settlement-bills/${encodeURIComponent(path)}`, {
          method: "POST", headers: { apikey: key as string, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: 3600 }),
        });
        if (r.ok) { const j = await r.json(); 原件链接 = `${url}/storage/v1${j.signedURL}`; }
      } catch { /* */ }
    }
    out.push({ id: String(b["id"]), 供应商: String(b["供应商"] ?? ""), 类型: String(b["类型"] ?? ""), 原币种: String(b["原币种"] ?? ""), 账单总额_原币: Number(b["账单总额_原币"]) || 0, 利润月: String(b["利润月"] ?? ""), created_at: String(b["created_at"] ?? ""), 原件链接 });
  }
  return out;
}

// 某 OPT 的 Kintone 成本明细（差异钻取）
export async function getCostLinesByOpt(opt: string): Promise<{ 供应商: string; 费用科目: string; 原币种: string; 金额_原币: number }[]> {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("kc_cost_lines").select("供应商,费用科目,原币种,金额_原币").eq("opt_no", opt);
  return (data ?? []) as { 供应商: string; 费用科目: string; 原币种: string; 金额_原币: number }[];
}

export interface PendingRecon { id: string; opt_no: string; 供应商: string; 账单金额_原币: number; kintone金额_原币: number | null; 差额: number | null; 差异类型: string; 状态: string; 利润月: string; 复核备注?: string }
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
// 把账单原件存入 Storage(settlement-bills)，返回存储路径（原件存档/内控留存）。
export async function uploadBillFile(bytes: Buffer, 供应商: string, month: string, ext = "pdf", mime = "application/pdf"): Promise<string | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const safe = (供应商 || "bill").replace(/[^\w一-鿿]/g, "_").slice(0, 30);
    const path = `${month}/${safe}_${Date.now()}.${ext}`;
    const res = await fetch(`${url}/storage/v1/object/settlement-bills/${encodeURIComponent(path)}`, {
      method: "POST",
      headers: { apikey: key as string, Authorization: `Bearer ${key}`, "Content-Type": mime },
      body: bytes,
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
  // 去重：同利润月同OPT的旧对账记录先删，重传即替换、不累积
  const optList = [...new Set(result.rows.map((r) => r.opt_no))];
  for (let i = 0; i < optList.length; i += 100) await sb.from("reconciliations").delete().eq("利润月", month).in("opt_no", optList.slice(i, i + 100));
  await sb.from("reconciliations").insert(result.rows.map((r) => ({ opt_no: r.opt_no, 供应商: r.kintone供应商 || r.供应商, kintone金额_原币: r.kintoneAmount, 账单金额_原币: r.billAmount, 差额: r.diff, 差异类型: typeMap[r.status], 状态: r.status === "匹配" ? "已解决" : "待复核", 利润月: month })));
}
