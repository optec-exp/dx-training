import { getSupabaseAdmin } from "./supabase-server";

// Kintone → settlement 镜像表 同步（只读拉 Kintone，写只进 Supabase）。
// 与 scripts/sync-cases.mjs / sync-sga.mjs 同一套映射，供 app 的"手动同步"调用。

const KBASE = process.env.KINTONE_BASE_URL || "https://si8qxbanrfkx.cybozu.com";

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`缺少环境变量 ${name}`);
  return v;
}

type KRecord = Record<string, { type?: string; value: unknown }>;
const str = (f?: { value: unknown }) =>
  f && f.value != null && typeof f.value !== "object" ? String(f.value) : "";
const num = (f?: { value: unknown }) => {
  if (!f || f.value == null || f.value === "") return null;
  const n = parseFloat(String(f.value));
  return Number.isFinite(n) ? n : null;
};
function jstDate(v: string): string | null {
  if (!v) return null;
  if (!v.includes("T")) return v.slice(0, 10);
  return new Date(new Date(v).getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

// 按 $id seek 分页拉取（filter 由调用方给）。
async function fetchKintone(appId: string, token: string, filter: string): Promise<KRecord[]> {
  const out: KRecord[] = [];
  let lastId = 0;
  for (;;) {
    const q = `${filter}${filter ? " and " : ""}$id > ${lastId} order by $id asc limit 500`;
    const url = `${KBASE}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { "X-Cybozu-API-Token": token } });
    if (!res.ok) throw new Error(`Kintone ${appId}: ${res.status} ${await res.text()}`);
    const { records } = (await res.json()) as { records: KRecord[] };
    out.push(...records);
    if (records.length < 500) break;
    lastId = Number((records[records.length - 1]["$id"].value as string));
  }
  return out;
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1;
  return { from: `${y}-${pad(m)}-01T00:00:00+09:00`, to: `${ny}-${pad(nm)}-01T00:00:00+09:00` };
}

// ========== 案件同步 ==========
const CASE_APPS = [
  { appType: "air", idEnv: "KINTONE_APP_AIR_CASES_ID", tokEnv: "KINTONE_APP_AIR_CASES_TOKEN", company: "EXPRESS", line: "AIR", timeField: "請求日" },
  { appType: "sea", idEnv: "KINTONE_APP_SEA_CASES_ID", tokEnv: "KINTONE_APP_SEA_CASES_TOKEN", company: "EXPRESS", line: "SEA", timeField: "請求日" },
  { appType: "ec", idEnv: "KINTONE_APP_EC_CASES_ID", tokEnv: "KINTONE_APP_EC_CASES_TOKEN", company: "TRADING", line: "EC", timeField: "纳品完了日" },
];

export async function syncCases(month: string): Promise<{ total: number; perApp: Record<string, number> }> {
  const { from, to } = monthRange(month);
  const sb = getSupabaseAdmin();
  const perApp: Record<string, number> = {};
  let total = 0;
  for (const app of CASE_APPS) {
    const records = await fetchKintone(envOrThrow(app.idEnv), envOrThrow(app.tokEnv), `${app.timeField} >= "${from}" and ${app.timeField} < "${to}"`);
    const rows = records.map((r) => {
      const date = jstDate(str(r[app.timeField]));
      return {
        opt_no: str(r["当社案件番号"]), company: app.company, business_line: app.line, source_app: envOrThrow(app.idEnv),
        "納品完了日": date, "利润月": date ? date.slice(0, 7) : null,
        "对应小组": str(r["チーム案件判断"]), "服务类型": str(r["Transport_Type"]), business_scope: str(r["Business_Scope"]),
        "国别": str(r["顧客国コード"]), "顾客": str(r["顧客名"]), mode: str(r["Mode"]),
        "出发": str(r["出発地域"]), "到达": str(r["到着地域"]), "业务范围": str(r["業務範囲"]),
        "見積team": app.appType === "ec" ? null : str(r["見積チーム"]), "輸出team": str(r["輸出対応チーム"]), "輸入team": str(r["輸入対応チーム"]),
        "自社通関費_日元": num(r["請求合計"]), "自社通関費_人民币": num(r["元換算請求合計"]),
        "売上_日元": num(r["円換算売上合計"]), "売上_人民币": num(r["元換算売上合計"]),
        "成本_日元": num(r["円換算費用合計"]), "成本_人民币": num(r["元換算費用合計"]),
        "毛利_日元": num(r["円換算粗利益"]), "毛利_人民币": num(r["元換算粗利益"]),
      };
    }).filter((x) => x.opt_no);
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await sb.from("kc_cases").upsert(rows.slice(i, i + 500), { onConflict: "opt_no" });
      if (error) throw new Error(`写 kc_cases 失败: ${error.message}`);
    }
    perApp[app.line] = rows.length;
    total += rows.length;
  }
  return { total, perApp };
}

// ========== 贩管费同步 ==========
const SGA_APPS = [
  { idEnv: "KINTONE_APP_SGA_JP_ID", tokEnv: "KINTONE_APP_SGA_JP_TOKEN" },
  { idEnv: "KINTONE_APP_SGA_CN_ID", tokEnv: "KINTONE_APP_SGA_CN_TOKEN" },
  { idEnv: "KINTONE_APP_SGA_EC_ID", tokEnv: "KINTONE_APP_SGA_EC_TOKEN" },
];
const FEE_MAP: Record<string, string> = {
  人件費: "人件費", 人工费: "人件費", 事業活動費: "事業活動費", 业务活动费: "事業活動費",
  事業維持費: "事業維持費", 业务维持费: "事業維持費", "人材·IT投資": "人材·IT投資", 人才与IT投资: "人材·IT投資",
  役員関連費用: "役員関連費用", 税金: "税金", 对象外: "对象外",
};
const CN_DEPTS = new Set(["OS課", "総務人事室", "財務室", "管理部", "DX室（中国）", "海外開発室", "業務開発室", "物流開発室", "Project室", "Japan Desk課", "業務財務室", "上海支店", "Marketing", "治理室", "GC課"]);
const JP_DEPTS = new Set(["TCC課", "通関課", "営業課", "業務課", "総務課"]);
function deptRegion(d: string): string | null {
  if (CN_DEPTS.has(d)) return "中国";
  if (JP_DEPTS.has(d)) return "日本";
  if (/（中国）|\(中国\)/.test(d)) return "中国";
  return null;
}
const checked = (f?: { value: unknown }) => Array.isArray(f?.value) && (f!.value as unknown[]).length > 0;

export async function syncSga(month: string): Promise<{ rows: number; total: number; excluded: number; unmapped: string[] }> {
  const kanKey = month.replace("-", "");
  const sb = getSupabaseAdmin();
  const out: Record<string, unknown>[] = [];
  const unmapped = new Set<string>();
  let total = 0, excluded = 0;
  for (const app of SGA_APPS) {
    const records = await fetchKintone(envOrThrow(app.idEnv), envOrThrow(app.tokEnv), `販管キー = "${kanKey}"`);
    for (const r of records) {
      const rawFee = str(r["費用类型"]) || str(r["費用類型"]);
      const fee = FEE_MAP[rawFee] || rawFee || "(未知)";
      const isExcluded = fee === "税金" || fee === "对象外" || checked(r["集計対象外"]) || checked(r["収入項目ですか"]);
      const sub = (r["部署按分"]?.value as { value: KRecord }[]) || [];
      for (const row of sub) {
        const amt = num(row.value?.["部署按分費用JPY"]) || 0;
        if (!amt) continue;
        // 部署名优先；为空时回退 部署キー(去 日本/中国 前缀)——有按分费用必有部署
        let d = str(row.value?.["部署名"]).trim();
        if (!d) d = str(row.value?.["部署キー"]).replace(/^(日本|中国)/, "").trim();
        const region = deptRegion(d);
        out.push({ source_app: envOrThrow(app.idEnv), "期间": month, region, "部门": d, "费用类型": fee, "是否除外": isExcluded, "金额": amt, "分摊到小组": d });
        if (!isExcluded) { total += amt; if (region == null) unmapped.add(d); } else excluded += amt;
      }
    }
  }
  await sb.from("sg_a_lines").delete().eq("期间", month);
  for (let i = 0; i < out.length; i += 500) {
    const { error } = await sb.from("sg_a_lines").insert(out.slice(i, i + 500));
    if (error) throw new Error(`写 sg_a_lines 失败: ${error.message}`);
  }
  return { rows: out.length, total, excluded, unmapped: [...unmapped] };
}

// ========== ④ 三App同步排查 ==========
const RECEIPT_APPS = [
  { idEnv: "KINTONE_APP_EXP_RECEIPTS_ID", tokEnv: "KINTONE_APP_EXP_RECEIPTS_TOKEN" },
  { idEnv: "KINTONE_APP_EC_RECEIPTS_ID", tokEnv: "KINTONE_APP_EC_RECEIPTS_TOKEN" },
];
const PAYMENT_APPS = [
  { idEnv: "KINTONE_APP_EXP_PAYMENTS_ID", tokEnv: "KINTONE_APP_EXP_PAYMENTS_TOKEN" },
  { idEnv: "KINTONE_APP_EC_PAYMENTS_ID", tokEnv: "KINTONE_APP_EC_PAYMENTS_TOKEN" },
];
// 按 OPT 批量(每100个) + $id seek 分页，汇总某金额字段
async function sumByOpt(appId: string, token: string, opts: string[], sumField: string): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (let i = 0; i < opts.length; i += 100) {
    const inList = opts.slice(i, i + 100).map((o) => `"${o}"`).join(",");
    let lastId = 0;
    for (;;) {
      const q = `当社案件番号 in (${inList}) and $id > ${lastId} order by $id asc limit 500`;
      const res = await fetch(`${KBASE}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}`, { headers: { "X-Cybozu-API-Token": token } });
      if (!res.ok) throw new Error(`Kintone ${appId}: ${res.status} ${await res.text()}`);
      const { records } = (await res.json()) as { records: KRecord[] };
      for (const rec of records) {
        const opt = str(rec["当社案件番号"]);
        map.set(opt, (map.get(opt) || 0) + (num(rec[sumField]) || 0));
      }
      if (records.length < 500) break;
      lastId = Number(records[records.length - 1]["$id"].value as string);
    }
  }
  return map;
}

export async function syncCheck(month: string): Promise<{ total: number; 收入差异数: number; 成本差异数: number }> {
  const sb = getSupabaseAdmin();
  // 1) 案件（从已同步的 kc_cases 读，分页绕过 1000 行上限）
  const cases: { opt_no: string; company: string; 売上_日元: number | null; 成本_日元: number | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("kc_cases").select("opt_no,company,売上_日元,成本_日元").eq("利润月", month).range(from, from + 999);
    if (error) throw new Error(`读取 kc_cases 失败: ${error.message}`);
    const d = (data ?? []) as typeof cases;
    cases.push(...d);
    if (d.length < 1000) break;
  }
  if (cases.length === 0) throw new Error(`${month} 无案件数据，请先「同步案件」`);
  const opts = cases.map((c) => c.opt_no);
  // 2) Kintone 入金/支付 按 OPT 汇总
  const 入金 = new Map<string, number>();
  for (const app of RECEIPT_APPS) for (const [k, val] of await sumByOpt(envOrThrow(app.idEnv), envOrThrow(app.tokEnv), opts, "円換算売上合計")) 入金.set(k, (入金.get(k) || 0) + val);
  const 支付 = new Map<string, number>();
  for (const app of PAYMENT_APPS) for (const [k, val] of await sumByOpt(envOrThrow(app.idEnv), envOrThrow(app.tokEnv), opts, "円換算費用合計")) 支付.set(k, (支付.get(k) || 0) + val);
  // 3) 比对
  const rows = cases.map((c) => {
    const caseRev = Number(c.売上_日元) || 0, caseCost = Number(c.成本_日元) || 0;
    const inSum = 入金.get(c.opt_no) || 0, paySum = 支付.get(c.opt_no) || 0;
    const revDiff = Math.round(caseRev - inSum), costDiff = Math.round(caseCost - paySum);
    return { opt_no: c.opt_no, company: c.company, "利润月": month, "案件收入": caseRev, "入金合计": inSum, "收入差异": revDiff, "案件成本": caseCost, "支付合计": paySum, "成本差异": costDiff, "状态": (Math.abs(revDiff) > 1 || Math.abs(costDiff) > 1) ? "差异" : "一致" };
  });
  // 4) 写 sync_checks
  await sb.from("sync_checks").delete().eq("利润月", month);
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from("sync_checks").insert(rows.slice(i, i + 500));
    if (error) throw new Error(`写 sync_checks 失败: ${error.message}`);
  }
  return { total: rows.length, 收入差异数: rows.filter((r) => Math.abs(r.收入差异) > 1).length, 成本差异数: rows.filter((r) => Math.abs(r.成本差异) > 1).length };
}

// ========== ⑦ 应收/应付账龄同步（含预计收付日=支払期日）==========
export async function syncAging(refDate: string): Promise<{ 应收: number; 应付: number; 应收超期: number; 应付超期: number }> {
  const ref = new Date(refDate + "T00:00:00+09:00").getTime();
  const bucketOf = (due: string) => {
    if (!due) return { 账龄桶: "0-30", 超期: false, due: null as string | null };
    const days = Math.floor((ref - new Date(due + "T00:00:00+09:00").getTime()) / 86400000);
    return { 账龄桶: days <= 30 ? "0-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "90+", 超期: days > 0, due };
  };
  const rows: Record<string, unknown>[] = [];
  for (const [idEnv, tokEnv] of [["KINTONE_APP_EXP_RECEIPTS_ID", "KINTONE_APP_EXP_RECEIPTS_TOKEN"], ["KINTONE_APP_EC_RECEIPTS_ID", "KINTONE_APP_EC_RECEIPTS_TOKEN"]]) {
    for (const rec of await fetchKintone(envOrThrow(idEnv), envOrThrow(tokEnv), `円換算差額未入金 > 1`)) {
      const amt = num(rec["円換算差額未入金"]) || 0; if (amt <= 1) continue;
      const b = bucketOf(str(rec["支払期日"]));
      rows.push({ "期间": refDate, "类型": "应收", "客户供应商": str(rec["顧客名"]), "金额": amt, "账龄桶": b.账龄桶, "是否超期": b.超期, "预计收付日": b.due });
    }
  }
  for (const [idEnv, tokEnv] of [["KINTONE_APP_EXP_PAYMENTS_ID", "KINTONE_APP_EXP_PAYMENTS_TOKEN"], ["KINTONE_APP_EC_PAYMENTS_ID", "KINTONE_APP_EC_PAYMENTS_TOKEN"]]) {
    for (const rec of await fetchKintone(envOrThrow(idEnv), envOrThrow(tokEnv), `円換算差額未払金 > 1`)) {
      const amt = num(rec["円換算差額未払金"]) || 0; if (amt <= 1) continue;
      const b = bucketOf(str(rec["支払期日"]));
      rows.push({ "期间": refDate, "类型": "应付", "客户供应商": str(rec["支払先"]), "金额": amt, "账龄桶": b.账龄桶, "是否超期": b.超期, "预计收付日": b.due });
    }
  }
  const sb = getSupabaseAdmin();
  await sb.from("ar_ap_aging").delete().in("类型", ["应收", "应付"]);
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from("ar_ap_aging").insert(rows.slice(i, i + 500));
    if (error) throw new Error(`写 ar_ap_aging 失败: ${error.message}`);
  }
  const ar = rows.filter((r) => r["类型"] === "应收"), ap = rows.filter((r) => r["类型"] === "应付");
  return { 应收: ar.length, 应付: ap.length, 应收超期: ar.filter((r) => r["是否超期"]).length, 应付超期: ap.filter((r) => r["是否超期"]).length };
}

// ========== ⑥ 银行残高同步 ==========
export async function syncBank(month: string): Promise<{ rows: number }> {
  const key = month.replace("-", "");
  const records = await fetchKintone(envOrThrow("KINTONE_APP_BANK_BALANCE_ID"), envOrThrow("KINTONE_APP_BANK_BALANCE_TOKEN"), `年月 = "${key}"`);
  const rows = records.map((r) => ({
    "银行": str(r["銀行"]), "币种": str(r["通貨"]), "月份": month, "口座番号": str(r["口座番号"]),
    "期初残高": num(r["前月末残高"]), "期末残高": num(r["残高"]), "残高差额": num(r["差額"]),
    "円換算残高": num(r["円換算残高"]), "対象法人": str(r["対象法人"]),
  }));
  const sb = getSupabaseAdmin();
  await sb.from("kc_bank_balance").delete().eq("月份", month);
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from("kc_bank_balance").insert(rows.slice(i, i + 500));
    if (error) throw new Error(`写 kc_bank_balance 失败: ${error.message}`);
  }
  return { rows: rows.length };
}

// ========== ⑥ 决算现金勾稽同步（现金口径=实际收付款日；按 法人(EXP/TRD)×币种）==========
// 法人映射：EXP=請求入金/支付EXP + 日本/中国贩管费；TRD=EC入金/支付EC + EC贩管费。
type LF = "EXP" | "TRD";
export async function syncSettlementCash(month: string): Promise<{ 行数: number; 有差异: number }> {
  const inMonth = (d?: string) => !!d && String(d).slice(0, 7) === month;
  const k = (lf: LF, cur: string) => `${lf}|${cur}`;
  const 入金 = new Map<string, number>(), 业务出金 = new Map<string, number>(), 贩管费出金 = new Map<string, number>();
  const add = (m: Map<string, number>, lf: LF, cur: string, val: number) => m.set(k(lf, cur), (m.get(k(lf, cur)) || 0) + val);

  // 入金：請求入金 入金テーブル.入金日 在月内 → 入金額(原币)，按 請求通貨
  for (const [lf, idEnv, tokEnv] of [["EXP", "KINTONE_APP_EXP_RECEIPTS_ID", "KINTONE_APP_EXP_RECEIPTS_TOKEN"], ["TRD", "KINTONE_APP_EC_RECEIPTS_ID", "KINTONE_APP_EC_RECEIPTS_TOKEN"]] as [LF, string, string][]) {
    for (const rec of await fetchKintone(envOrThrow(idEnv), envOrThrow(tokEnv), "")) {
      const cur = str(rec["請求通貨_0"]) || str(rec["請求通貨"]) || "JPY";
      for (const row of (rec["入金テーブル"]?.value as { value: KRecord }[]) || []) {
        if (inMonth(str(row.value?.["入金日"]))) add(入金, lf, cur, num(row.value?.["入金額"]) || 0);
      }
    }
  }
  // 业务出金：支付 支払履歴.支払日履歴 在月内 → 支払額履歴(原币)，按 支払通貨
  for (const [lf, idEnv, tokEnv] of [["EXP", "KINTONE_APP_EXP_PAYMENTS_ID", "KINTONE_APP_EXP_PAYMENTS_TOKEN"], ["TRD", "KINTONE_APP_EC_PAYMENTS_ID", "KINTONE_APP_EC_PAYMENTS_TOKEN"]] as [LF, string, string][]) {
    for (const rec of await fetchKintone(envOrThrow(idEnv), envOrThrow(tokEnv), "")) {
      const cur = str(rec["支払通貨_0"]) || str(rec["支払通貨"]) || "JPY";
      for (const row of (rec["支払履歴"]?.value as { value: KRecord }[]) || []) {
        if (inMonth(str(row.value?.["支払日履歴"]))) add(业务出金, lf, cur, num(row.value?.["支払額履歴"]) || 0);
      }
    }
  }
  // 贩管费出金：支払日 在月内 → 費用(原币)，按 通貨；日本/中国贩管费=EXP，EC贩管费=TRD
  const SGA_LF: Record<string, LF> = { KINTONE_APP_SGA_JP_ID: "EXP", KINTONE_APP_SGA_CN_ID: "EXP", KINTONE_APP_SGA_EC_ID: "TRD" };
  for (const app of SGA_APPS) {
    const lf = SGA_LF[app.idEnv] || "EXP";
    for (const rec of await fetchKintone(envOrThrow(app.idEnv), envOrThrow(app.tokEnv), `販管キー = "${month.replace("-", "")}"`)) {
      if (inMonth(str(rec["支払日"]))) add(贩管费出金, lf, str(rec["通貨"]) || "JPY", num(rec["費用"]) || 0);
    }
  }
  // 残高差额 by 法人×币种（从已同步 kc_bank_balance），并建 口座番号→(法人,银行) 映射
  const sb = getSupabaseAdmin();
  const { data: bank } = await sb.from("kc_bank_balance").select("银行,币种,残高差额,対象法人,口座番号").eq("月份", month);
  const 残高 = new Map<string, number>();
  const acctMap: { 番号: string; 法人: LF; 银行: string }[] = [];
  const seenAcct = new Set<string>();
  for (const b of (bank ?? []) as { 银行: string; 币种: string; 残高差额: number; 対象法人: string; 口座番号: string }[]) {
    const lf = (b.対象法人 === "TRD" ? "TRD" : "EXP") as LF;
    add(残高, lf, b.币种, Number(b.残高差额) || 0);
    const no = (b.口座番号 || "").trim();
    if (no && !seenAcct.has(no)) { seenAcct.add(no); acctMap.push({ 番号: no, 法人: lf, 银行: b.银行 }); }
  }
  // 口座串(银行+口座番号+币种+用途) → 账户：匹配其中最长的、被包含的口座番号
  acctMap.sort((a, b) => b.番号.length - a.番号.length);
  const acctOf = (口座str: string) => { for (const a of acctMap) if (口座str.includes(a.番号)) return a; return null; };

  // ⑥ 内部资金移动 by 法人×币种（转入/转出分列）+ 按账户：读 资金移动App(EXP/TRD)，筛 支払種別=資金移動，計算月在本月；换汇用移動先口座換算金額(实际到账额)
  const 转入 = new Map<string, number>(), 转出 = new Map<string, number>();
  type AcctMv = { 银行: string; 口座番号: string; 转入: number; 转出: number };
  const acctMove = new Map<string, Map<string, AcctMv>>(); // 法人|币种 → 番号 → {转入,转出}
  const bumpAcct = (lf: LF, cur: string, a: { 番号: string; 银行: string }, field: "转入" | "转出", val: number) => {
    const key = k(lf, cur); if (!acctMove.has(key)) acctMove.set(key, new Map());
    const m = acctMove.get(key)!; const e = m.get(a.番号) || { 银行: a.银行, 口座番号: a.番号, 转入: 0, 转出: 0 };
    e[field] += val; m.set(a.番号, e);
  };
  const FUND_APPS = [["KINTONE_APP_FUND_MOVE_EXP_ID", "KINTONE_APP_FUND_MOVE_EXP_TOKEN"], ["KINTONE_APP_FUND_MOVE_TRD_ID", "KINTONE_APP_FUND_MOVE_TRD_TOKEN"]];
  let moveCount = 0;
  for (const [idEnv, tokEnv] of FUND_APPS) {
    const id = (process.env[idEnv] || "").trim(), tok = (process.env[tokEnv] || "").trim();
    if (!/^\d+$/.test(id) || !tok || /[^\x20-\x7e]/.test(tok)) continue; // 未配置或占位符(非数字ID/含非ASCII的token,如 EXP 待补) → 跳过
    for (const rec of await fetchKintone(id, tok, `支払種別 in ("資金移動")`)) {
      const ym = (str(rec["計算"]) || "").slice(0, 7) || (str(rec["支払日キー"]).length === 6 ? `${str(rec["支払日キー"]).slice(0, 4)}-${str(rec["支払日キー"]).slice(4)}` : "");
      if (ym !== month) continue;
      const fromA = acctOf(str(rec["移動元口座"])), toA = acctOf(str(rec["移動先口座"]));
      const fromCur = str(rec["移動元通貨"]) || "JPY", toCur = str(rec["移動先通貨"]) || "JPY";
      const fromAmt = num(rec["移動元支払額"]) || 0, toAmt = num(rec["移動先口座換算金額"]) || num(rec["移動元支払額"]) || 0;
      if (fromA) { add(转出, fromA.法人, fromCur, fromAmt); bumpAcct(fromA.法人, fromCur, fromA, "转出", fromAmt); moveCount++; }
      if (toA) { add(转入, toA.法人, toCur, toAmt); bumpAcct(toA.法人, toCur, toA, "转入", toAmt); }
    }
  }

  const keys = new Set([...入金.keys(), ...业务出金.keys(), ...贩管费出金.keys(), ...残高.keys(), ...转入.keys(), ...转出.keys()]);
  const rows = [...keys].map((key) => {
    const [lf, cur] = key.split("|");
    const i = 入金.get(key) || 0, biz = 业务出金.get(key) || 0, sga = 贩管费出金.get(key) || 0;
    const tin = 转入.get(key) || 0, tout = 转出.get(key) || 0, mv = tin - tout;
    const 出金合计 = biz + sga, net = i - 出金合计, bal = 残高.get(key) || 0, diff = bal - net - mv;
    return {
      "利润月": month, "法人": lf, "币种": cur, "残高差额": Math.round(bal), "入金合计": Math.round(i), "出金合计": Math.round(出金合计),
      "现金净额": Math.round(net), "差异": Math.round(diff), "状态": Math.abs(diff) < 1 ? "平" : "有差异",
      "构成": {
        业务出金: Math.round(biz), 贩管费出金: Math.round(sga), 内部移动: Math.round(mv), 转入: Math.round(tin), 转出: Math.round(tout),
        账户: [...(acctMove.get(key)?.values() ?? [])].map((a) => ({ 银行: a.银行, 口座番号: a.口座番号, 转入: Math.round(a.转入), 转出: Math.round(a.转出) })),
      },
    };
  });
  await sb.from("settlement_checks").delete().eq("利润月", month);
  if (rows.length) { const { error } = await sb.from("settlement_checks").insert(rows); if (error) throw new Error(`写 settlement_checks 失败: ${error.message}`); }
  return { 行数: rows.length, 有差异: rows.filter((r) => r.状态 !== "平").length, 资金移动: moveCount };
}

// ④ 钻取：某 OPT 的 入金/支付 明细记录（实时读 Kintone，定位差异在哪条）
export interface SyncDetailRow { kind: "入金" | "支付"; app: string; 金额: number; 取引日: string; 编号: string }
export async function getSyncCheckDetail(opt: string): Promise<SyncDetailRow[]> {
  const out: SyncDetailRow[] = [];
  const pull = async (apps: { idEnv: string; tokEnv: string; label: string }[], sumField: string, kind: "入金" | "支付") => {
    for (const app of apps) {
      const q = `当社案件番号 = "${opt}" order by $id asc limit 100`;
      const res = await fetch(`${KBASE}/k/v1/records.json?app=${envOrThrow(app.idEnv)}&query=${encodeURIComponent(q)}`, { headers: { "X-Cybozu-API-Token": envOrThrow(app.tokEnv) } });
      if (!res.ok) continue;
      const { records } = (await res.json()) as { records: KRecord[] };
      for (const r of records) out.push({ kind, app: app.label, 金额: num(r[sumField]) || 0, 取引日: str(r["取引日"]) || str(r["請求日"]) || "", 编号: str(r["請求番号"]) || str(r["支払管理番号"]) || str(r["当社案件番号_明細"]) || `#${str(r["$id"])}` });
    }
  };
  await pull([{ idEnv: "KINTONE_APP_EXP_RECEIPTS_ID", tokEnv: "KINTONE_APP_EXP_RECEIPTS_TOKEN", label: "EXP入金" }, { idEnv: "KINTONE_APP_EC_RECEIPTS_ID", tokEnv: "KINTONE_APP_EC_RECEIPTS_TOKEN", label: "EC入金" }], "円換算売上合計", "入金");
  await pull([{ idEnv: "KINTONE_APP_EXP_PAYMENTS_ID", tokEnv: "KINTONE_APP_EXP_PAYMENTS_TOKEN", label: "EXP支付" }, { idEnv: "KINTONE_APP_EC_PAYMENTS_ID", tokEnv: "KINTONE_APP_EC_PAYMENTS_TOKEN", label: "EC支付" }], "円換算費用合計", "支付");
  return out;
}
