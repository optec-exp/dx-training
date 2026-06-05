// Kintone 字段探查（只读）。
// 用途：连 11 个 App，打印每个 App 的字段代码 / 类型 / 一条样本值（含子表内字段），
//       用于据真实字段建"Kintone → settlement 镜像表"的映射。
// 运行：node scripts/inspect-kintone.mjs
// 只读：仅 GET records.json；样本值过长会截断。

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const env = {};
  const text = readFileSync(join(root, ".env.local"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
const BASE = env.KINTONE_BASE_URL || "https://si8qxbanrfkx.cybozu.com";

const APPS = [
  ["AIR 案件管理", "KINTONE_APP_AIR_CASES_ID", "KINTONE_APP_AIR_CASES_TOKEN"],
  ["SEA 案件管理", "KINTONE_APP_SEA_CASES_ID", "KINTONE_APP_SEA_CASES_TOKEN"],
  ["EXP 请求入金", "KINTONE_APP_EXP_RECEIPTS_ID", "KINTONE_APP_EXP_RECEIPTS_TOKEN"],
  ["EXP 支付", "KINTONE_APP_EXP_PAYMENTS_ID", "KINTONE_APP_EXP_PAYMENTS_TOKEN"],
  ["贩管费(日本)", "KINTONE_APP_SGA_JP_ID", "KINTONE_APP_SGA_JP_TOKEN"],
  ["中国贩管费", "KINTONE_APP_SGA_CN_ID", "KINTONE_APP_SGA_CN_TOKEN"],
  ["EC 案件管理", "KINTONE_APP_EC_CASES_ID", "KINTONE_APP_EC_CASES_TOKEN"],
  ["EC 请求入金", "KINTONE_APP_EC_RECEIPTS_ID", "KINTONE_APP_EC_RECEIPTS_TOKEN"],
  ["EC 支付", "KINTONE_APP_EC_PAYMENTS_ID", "KINTONE_APP_EC_PAYMENTS_TOKEN"],
  ["EC 贩管费", "KINTONE_APP_SGA_EC_ID", "KINTONE_APP_SGA_EC_TOKEN"],
  ["银行残高管理", "KINTONE_APP_BANK_BALANCE_ID", "KINTONE_APP_BANK_BALANCE_TOKEN"],
];

function short(v) {
  let s = typeof v === "object" ? JSON.stringify(v) : String(v);
  if (s.length > 40) s = s.slice(0, 40) + "…";
  return s;
}

for (const [label, idKey, tokenKey] of APPS) {
  const appId = env[idKey];
  const token = env[tokenKey];
  console.log(`\n========== ${label}  (app=${appId}) ==========`);
  if (!appId || !token) {
    console.log("  ⚠ 缺少 ID 或 Token，跳过");
    continue;
  }
  try {
    const q = encodeURIComponent("order by $id desc limit 1");
    const url = `${BASE}/k/v1/records.json?app=${appId}&query=${q}&totalCount=true`;
    const res = await fetch(url, { headers: { "X-Cybozu-API-Token": token } });
    if (!res.ok) {
      console.log(`  ❌ HTTP ${res.status}: ${short(await res.text())}`);
      continue;
    }
    const data = await res.json();
    console.log(`  总记录数: ${data.totalCount}`);
    const rec = data.records?.[0];
    if (!rec) { console.log("  (无记录)"); continue; }
    console.log("  字段（代码 [类型] = 样本）:");
    for (const [code, f] of Object.entries(rec)) {
      const type = f.type || "?";
      if (type === "SUBTABLE") {
        const rows = Array.isArray(f.value) ? f.value : [];
        const sub = rows[0]?.value ? Object.keys(rows[0].value) : [];
        console.log(`    ▼ ${code} [SUBTABLE, ${rows.length} 行] 子字段: ${sub.join(", ") || "(空)"}`);
        if (rows[0]?.value) {
          for (const [sc, sf] of Object.entries(rows[0].value)) {
            console.log(`        - ${sc} [${sf.type}] = ${short(sf.value)}`);
          }
        }
      } else {
        console.log(`    ${code} [${type}] = ${short(f.value)}`);
      }
    }
  } catch (e) {
    console.log(`  ❌ 异常: ${e.message}`);
  }
}
console.log("\n探查完成。");
