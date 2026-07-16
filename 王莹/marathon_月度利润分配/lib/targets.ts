/**
 * 从 Google Sheet 拉取月度目标数据（JPY）。
 * Sheet 结构：
 *   年月     | 全社      | JP DESK   | OS       | project  | 通关
 *   2026-04  | 55882054  | 34718995  | 16865748 | 1297310  | 3000000
 *
 * 依赖 Sheet 设置为「知道链接的人可查看」，用公开 CSV export URL 拉取，
 * 不需要 Google API Key / OAuth。
 */

const CACHE_TTL_MS = 60_000;

const SHEET_COLUMN_TO_TEAM: Record<string, string> = {
  "全社": "__company__",
  "全公司": "__company__",
  "JP DESK": "Japan Desk",
  "Japan Desk": "Japan Desk",
  "OS": "OS",
  "project": "Project",
  "Project": "Project",
  "通关": "通关",
  "通関": "通关",
};

export interface MonthlyTargets {
  yearMonth: string;
  companyJpy: number;
  teamsJpy: Record<string, number>;
}

interface CacheEntry {
  targets: MonthlyTargets[];
  fetchedAt: number;
}

const globalCache = globalThis as unknown as {
  __targetsCache?: CacheEntry;
};

function buildCsvUrl(sheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let curField = "";
  let curRow: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          curField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        curField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        curRow.push(curField);
        curField = "";
      } else if (ch === "\n") {
        curRow.push(curField);
        rows.push(curRow);
        curField = "";
        curRow = [];
      } else if (ch === "\r") {
        // ignore
      } else {
        curField += ch;
      }
    }
  }
  if (curField.length > 0 || curRow.length > 0) {
    curRow.push(curField);
    rows.push(curRow);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

function normalizeYearMonth(raw: string): string | null {
  const trimmed = raw.trim();
  const m = trimmed.match(/^(\d{4})[-/年.](\d{1,2})/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

function parseNumber(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[,\s¥$￥]/g, "").trim();
  if (!cleaned) return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

async function fetchAll(sheetId: string): Promise<MonthlyTargets[]> {
  const res = await fetch(buildCsvUrl(sheetId), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Google Sheet 拉取失败 HTTP ${res.status}`);
  }
  const text = await res.text();
  const rows = parseCsv(text);
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.trim());
  const teamKeyByCol: (string | null)[] = header.map(
    (h) => SHEET_COLUMN_TO_TEAM[h] ?? null
  );

  const result: MonthlyTargets[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const ym = normalizeYearMonth(row[0] ?? "");
    if (!ym) continue;

    const teamsJpy: Record<string, number> = {};
    let companyJpy = 0;

    for (let c = 1; c < row.length; c++) {
      const teamKey = teamKeyByCol[c];
      if (!teamKey) continue;
      const v = parseNumber(row[c] ?? "");
      if (teamKey === "__company__") {
        companyJpy = v;
      } else {
        teamsJpy[teamKey] = v;
      }
    }

    result.push({ yearMonth: ym, companyJpy, teamsJpy });
  }
  return result;
}

export async function loadTargets(forceRefresh = false): Promise<MonthlyTargets[]> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) return [];

  if (!forceRefresh && globalCache.__targetsCache) {
    const c = globalCache.__targetsCache;
    if (Date.now() - c.fetchedAt < CACHE_TTL_MS) {
      return c.targets;
    }
  }
  try {
    const targets = await fetchAll(sheetId);
    globalCache.__targetsCache = { targets, fetchedAt: Date.now() };
    return targets;
  } catch (e) {
    console.error("[targets] Sheet 拉取失败:", e);
    if (globalCache.__targetsCache) return globalCache.__targetsCache.targets;
    throw e;
  }
}

export async function getMonthlyTarget(
  year: number,
  month: number,
  forceRefresh = false
): Promise<MonthlyTargets | null> {
  const all = await loadTargets(forceRefresh);
  const ym = `${year}-${String(month).padStart(2, "0")}`;
  return all.find((t) => t.yearMonth === ym) ?? null;
}
