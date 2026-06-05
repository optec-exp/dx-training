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
        "出发": str(r["出発地域"]), "到达": str(r["到着地域"]),
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
const CN_DEPTS = new Set(["OS課", "総務人事室", "財務室", "管理部", "DX室（中国）", "海外開発室", "業務開発室", "Project室", "Japan Desk課", "業務財務室", "上海支店", "Marketing", "治理室", "GC課"]);
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
        const d = str(row.value?.["部署名"]);
        const amt = num(row.value?.["部署按分費用JPY"]) || 0;
        if (!amt) continue;
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
