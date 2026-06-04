// Kintone 只读客户端。
// 铁律：本系统对 Kintone 全程【只读】——本文件只提供 GET，绝不提供任何写接口。
// 同步流程：fetchAllRecords(appKey) → 字段映射 → 落 Supabase 镜像表。

const BASE_URL = process.env.KINTONE_BASE_URL ?? "https://si8qxbanrfkx.cybozu.com";

// 11 个 App 的注册表。company/region/business_line 用于落库时打标识。
// 字段映射(Kintone field code → 镜像表列)在连上 App 后用 API 自动拉取再填写。
export type AppKey =
  | "AIR_CASES" | "SEA_CASES" | "EC_CASES"
  | "EXP_RECEIPTS" | "EC_RECEIPTS"
  | "EXP_PAYMENTS" | "EC_PAYMENTS"
  | "SGA_JP" | "SGA_CN" | "SGA_EC"
  | "BANK_BALANCE";

interface AppDef {
  envId: string;       // 环境变量名：App ID
  envToken: string;    // 环境变量名：只读 API Token
  company?: "EXPRESS" | "TRADING";
  region?: "日本" | "中国" | "EC";
  business_line?: "AIR" | "SEA" | "EC";
  label: string;
}

export const APP_REGISTRY: Record<AppKey, AppDef> = {
  AIR_CASES:    { envId: "KINTONE_APP_AIR_CASES_ID",    envToken: "KINTONE_APP_AIR_CASES_TOKEN",    company: "EXPRESS", business_line: "AIR", label: "AIR 案件管理" },
  SEA_CASES:    { envId: "KINTONE_APP_SEA_CASES_ID",    envToken: "KINTONE_APP_SEA_CASES_TOKEN",    company: "EXPRESS", business_line: "SEA", label: "SEA 案件管理" },
  EC_CASES:     { envId: "KINTONE_APP_EC_CASES_ID",     envToken: "KINTONE_APP_EC_CASES_TOKEN",     company: "TRADING", business_line: "EC",  label: "EC 案件管理" },
  EXP_RECEIPTS: { envId: "KINTONE_APP_EXP_RECEIPTS_ID", envToken: "KINTONE_APP_EXP_RECEIPTS_TOKEN", company: "EXPRESS", label: "EXP 请求入金（AIR·SEA 共用）" },
  EC_RECEIPTS:  { envId: "KINTONE_APP_EC_RECEIPTS_ID",  envToken: "KINTONE_APP_EC_RECEIPTS_TOKEN",  company: "TRADING", label: "EC 请求入金" },
  EXP_PAYMENTS: { envId: "KINTONE_APP_EXP_PAYMENTS_ID", envToken: "KINTONE_APP_EXP_PAYMENTS_TOKEN", company: "EXPRESS", label: "EXP 支付（AIR·SEA 共用）" },
  EC_PAYMENTS:  { envId: "KINTONE_APP_EC_PAYMENTS_ID",  envToken: "KINTONE_APP_EC_PAYMENTS_TOKEN",  company: "TRADING", label: "EC 支付" },
  SGA_JP:       { envId: "KINTONE_APP_SGA_JP_ID",       envToken: "KINTONE_APP_SGA_JP_TOKEN",       company: "EXPRESS", region: "日本", label: "贩管费管理（日本）" },
  SGA_CN:       { envId: "KINTONE_APP_SGA_CN_ID",       envToken: "KINTONE_APP_SGA_CN_TOKEN",       company: "EXPRESS", region: "中国", label: "中国贩管费管理" },
  SGA_EC:       { envId: "KINTONE_APP_SGA_EC_ID",       envToken: "KINTONE_APP_SGA_EC_TOKEN",       company: "TRADING", region: "EC",   label: "EC 贩管费管理" },
  BANK_BALANCE: { envId: "KINTONE_APP_BANK_BALANCE_ID", envToken: "KINTONE_APP_BANK_BALANCE_TOKEN", label: "银行残高管理（通用）" },
};

export type KintoneRecord = Record<string, { value: unknown }>;

// 分页拉取某 App 的全部记录（只读 GET）。用 seek 方式按 $id 翻页，稳定不漏。
export async function fetchAllRecords(appKey: AppKey, query = ""): Promise<KintoneRecord[]> {
  const def = APP_REGISTRY[appKey];
  const appId = process.env[def.envId];
  const token = process.env[def.envToken];
  if (!appId || !token) {
    throw new Error(`App ${appKey}(${def.label}) 缺少 ${def.envId} 或 ${def.envToken}`);
  }

  const out: KintoneRecord[] = [];
  let lastId = 0;
  const LIMIT = 500;
  // 注意：仅 GET，永不 POST/PUT/DELETE。
  for (;;) {
    const cond = [query, `$id > ${lastId}`].filter(Boolean).join(" and ");
    const q = `${cond} order by $id asc limit ${LIMIT}`;
    const url = `${BASE_URL}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { "X-Cybozu-API-Token": token } });
    if (!res.ok) throw new Error(`Kintone 读取失败 ${appKey}: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { records: KintoneRecord[] };
    out.push(...data.records);
    if (data.records.length < LIMIT) break;
    lastId = Number((data.records[data.records.length - 1]["$id"]?.value as string) ?? lastId);
  }
  return out;
}
