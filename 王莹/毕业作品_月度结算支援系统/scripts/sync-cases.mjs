// 案件同步（B.1）：AIR/SEA/EC 案件 → Supabase settlement.kc_cases。
// 只读拉 Kintone（按月用 請求日/纳品完了日 过滤）→ 映射 → upsert。
// 运行：node scripts/sync-cases.mjs 2026-05   （默认 2026-05）

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
function loadEnv() {
  const env = {};
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}
const env = loadEnv();
const KBASE = env.KINTONE_BASE_URL || "https://si8qxbanrfkx.cybozu.com";
const SUPA = env.NEXT_PUBLIC_SUPABASE_URL;
const SKEY = env.SUPABASE_SERVICE_ROLE_KEY;

const ym = process.argv[2] || "2026-05";
const [year, month] = ym.split("-").map(Number);

// 三个案件 App（company/business_line/时间字段）
const CASE_APPS = [
  { appType: "air", appId: env.KINTONE_APP_AIR_CASES_ID, token: env.KINTONE_APP_AIR_CASES_TOKEN, company: "EXPRESS", line: "AIR", timeField: "請求日" },
  { appType: "sea", appId: env.KINTONE_APP_SEA_CASES_ID, token: env.KINTONE_APP_SEA_CASES_TOKEN, company: "EXPRESS", line: "SEA", timeField: "請求日" },
  { appType: "ec", appId: env.KINTONE_APP_EC_CASES_ID, token: env.KINTONE_APP_EC_CASES_TOKEN, company: "TRADING", line: "EC", timeField: "纳品完了日" },
];

const str = (f) => (f && f.value != null && typeof f.value !== "object" ? String(f.value) : "");
const num = (f) => {
  if (!f || f.value == null || f.value === "") return null;
  const n = parseFloat(f.value);
  return Number.isFinite(n) ? n : null;
};

function monthRange(y, m) {
  const pad = (n) => String(n).padStart(2, "0");
  const from = `${y}-${pad(m)}-01T00:00:00+09:00`;
  const ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1;
  return { from, to: `${ny}-${pad(nm)}-01T00:00:00+09:00` };
}

async function fetchMonth(app) {
  const { from, to } = monthRange(year, month);
  const out = [];
  let lastId = 0;
  for (;;) {
    const q = `${app.timeField} >= "${from}" and ${app.timeField} < "${to}" and $id > ${lastId} order by $id asc limit 500`;
    const url = `${KBASE}/k/v1/records.json?app=${app.appId}&query=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { "X-Cybozu-API-Token": app.token } });
    if (!res.ok) throw new Error(`Kintone ${app.appType} ${res.status}: ${await res.text()}`);
    const { records } = await res.json();
    out.push(...records);
    if (records.length < 500) break;
    lastId = Number(records[records.length - 1]["$id"].value);
  }
  return out;
}

function mapCase(app, r) {
  const t = str(r[app.timeField]);
  const date = t ? t.slice(0, 10) : null;
  return {
    opt_no: str(r["当社案件番号"]),
    company: app.company,
    business_line: app.line,
    source_app: String(app.appId),
    "納品完了日": date,
    "利润月": date ? date.slice(0, 7) : null,
    "对应小组": str(r["チーム案件判断"]),
    "服务类型": str(r["Transport_Type"]),
    business_scope: str(r["Business_Scope"]),
    "国别": str(r["顧客国コード"]),
    "顾客": str(r["顧客名"]),
    mode: str(r["Mode"]),
    "出发": str(r["出発地域"]),
    "到达": str(r["到着地域"]),
    "見積team": app.appType === "ec" ? null : str(r["見積チーム"]),
    "輸出team": str(r["輸出対応チーム"]),
    "輸入team": str(r["輸入対応チーム"]),
    "自社通関費_日元": num(r["請求合計"]),
    "自社通関費_人民币": num(r["元換算請求合計"]),
    "売上_日元": num(r["円換算売上合計"]),
    "売上_人民币": num(r["元換算売上合計"]),
    "成本_日元": num(r["円換算費用合計"]),
    "成本_人民币": num(r["元換算費用合計"]),
    "毛利_日元": num(r["円換算粗利益"]),
    "毛利_人民币": num(r["元換算粗利益"]),
  };
}

async function upsert(rows) {
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const res = await fetch(`${SUPA}/rest/v1/kc_cases?on_conflict=opt_no`, {
      method: "POST",
      headers: {
        apikey: SKEY,
        Authorization: `Bearer ${SKEY}`,
        "Content-Type": "application/json",
        "Content-Profile": "settlement",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) throw new Error(`Supabase upsert ${res.status}: ${await res.text()}`);
  }
}

console.log(`同步案件 ${ym} ...`);
let total = 0;
for (const app of CASE_APPS) {
  const records = await fetchMonth(app);
  const rows = records.map((r) => mapCase(app, r)).filter((x) => x.opt_no);
  await upsert(rows);
  console.log(`  ${app.appType.toUpperCase()} (app=${app.appId}): 拉取 ${records.length}，写入 ${rows.length}`);
  total += rows.length;
}
console.log(`✅ 完成，共写入 kc_cases ${total} 条。`);
