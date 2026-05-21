import { KINTONE_APP_CONFIG, type AppType } from "./constants";
import type { KintoneCase } from "./types";

interface KintoneRawValue {
  value: string | number | { value: string }[] | null | undefined;
}

interface KintoneRawRecord {
  $id: KintoneRawValue;
  [key: string]: KintoneRawValue;
}

interface KintoneResponse {
  records: KintoneRawRecord[];
  totalCount: string | null;
}

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function asString(v: KintoneRawValue | undefined): string {
  if (!v) return "";
  const x = v.value;
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "number") return String(x);
  if (Array.isArray(x)) return "";
  return "";
}

function asNumber(v: KintoneRawValue | undefined): number {
  if (!v) return 0;
  const x = v.value;
  if (x == null || x === "") return 0;
  if (typeof x === "number") return x;
  if (typeof x === "string") {
    const n = parseFloat(x);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function buildMonthRange(year: number, month: number): { from: string; to: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const from = `${year}-${pad(month)}-01T00:00:00+09:00`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const to = `${nextYear}-${pad(nextMonth)}-01T00:00:00+09:00`;
  return { from, to };
}

async function queryApp(
  appType: AppType,
  year: number,
  month: number
): Promise<KintoneRawRecord[]> {
  const cfg = KINTONE_APP_CONFIG[appType];
  const subdomain = getEnv("KINTONE_SUBDOMAIN");
  const token = getEnv(cfg.tokenEnv);
  const { from, to } = buildMonthRange(year, month);

  const query = `${cfg.timeField} >= "${from}" and ${cfg.timeField} < "${to}" order by ${cfg.timeField} asc limit 500`;

  const url = `https://${subdomain}.cybozu.com/k/v1/records.json?app=${cfg.appId}&query=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "X-Cybozu-API-Token": token },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kintone ${cfg.label} 拉取失败: HTTP ${res.status} ${text}`);
  }

  const data = (await res.json()) as KintoneResponse;
  return data.records ?? [];
}

function mapRecord(appType: AppType, r: KintoneRawRecord): KintoneCase {
  const cfg = KINTONE_APP_CONFIG[appType];
  return {
    appType,
    recordId: asString(r.$id),
    caseNumber: asString(r["当社案件番号"]),
    customerName: asString(r["顧客名"]),
    customerCountry: asString(r["顧客国コード"]),
    exportTeam: asString(r["輸出対応チーム"]),
    importTeam: asString(r["輸入対応チーム"]),
    mitsumoriTeam: appType === "ec" ? null : asString(r["見積チーム"]),
    grossProfitJpy: asNumber(r["円換算粗利益"]),
    grossProfitCny: asNumber(r["元換算粗利益"]),
    kanFeeJpy: asNumber(r["請求合計"]),
    kanFeeCny: asNumber(r["元換算請求合計"]),
    salesJpy: asNumber(r["円換算売上合計"]),
    salesCny: asNumber(r["元換算売上合計"]),
    costJpy: asNumber(r["円換算費用合計"]),
    costCny: asNumber(r["元換算費用合計"]),
    invoiceDate: asString(r[cfg.timeField]),
  };
}

interface CacheEntry {
  cases: KintoneCase[];
  fetchedAt: number;
}

const globalCache = globalThis as unknown as {
  __kintoneCache?: Map<string, CacheEntry>;
};
if (!globalCache.__kintoneCache) {
  globalCache.__kintoneCache = new Map();
}
const cache = globalCache.__kintoneCache;

export interface FetchResult {
  cases: KintoneCase[];
  fetchedAt: number;
  fromCache: boolean;
}

export async function fetchMonthlyCases(
  year: number,
  month: number,
  forceRefresh = false
): Promise<FetchResult> {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  if (!forceRefresh) {
    const hit = cache.get(key);
    if (hit) {
      return { cases: hit.cases, fetchedAt: hit.fetchedAt, fromCache: true };
    }
  }

  const [airRecords, seaRecords, ecRecords] = await Promise.all([
    queryApp("air", year, month),
    queryApp("sea", year, month),
    queryApp("ec", year, month),
  ]);

  const cases: KintoneCase[] = [
    ...airRecords.map((r) => mapRecord("air", r)),
    ...seaRecords.map((r) => mapRecord("sea", r)),
    ...ecRecords.map((r) => mapRecord("ec", r)),
  ];

  const fetchedAt = Date.now();
  cache.set(key, { cases, fetchedAt });
  return { cases, fetchedAt, fromCache: false };
}
