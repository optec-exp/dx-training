// 决算现金净额勾稽（⑥）：按币种 现金净额(入金−出金−贩管费出金) vs 残高差额 → settlement_checks。
// 现金口径=实际收付款日。运行：node scripts/sync-settlement-cash.mjs 2026-05
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const l of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const t = l.trim(); if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("="); if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}
const KBASE = env.KINTONE_BASE_URL, SUPA = env.NEXT_PUBLIC_SUPABASE_URL, SKEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ym = process.argv[2] || "2026-05";
const v = (f) => (f && f.value != null && typeof f.value !== "object" ? f.value : "");
const num = (x) => { const n = parseFloat(x); return Number.isFinite(n) ? n : 0; };
const inMonth = (d) => d && String(d).slice(0, 7) === ym;
const add = (m, k, val) => m.set(k || "?", (m.get(k || "?") || 0) + val);

async function fetchAll(id, token, query = "") {
  const out = []; let lastId = 0;
  for (;;) {
    const q = `${query}${query ? " and " : ""}$id > ${lastId} order by $id asc limit 500`;
    const r = await fetch(`${KBASE}/k/v1/records.json?app=${id}&query=${encodeURIComponent(q)}`, { headers: { "X-Cybozu-API-Token": token } });
    if (!r.ok) throw new Error(`app ${id}: ${r.status} ${await r.text()}`);
    const { records } = await r.json();
    out.push(...records);
    if (records.length < 500) break;
    lastId = Number(records[records.length - 1]["$id"].value);
  }
  return out;
}

const 入金 = new Map(), 出金 = new Map();

// 入金：请求入金 入金テーブル.入金日 在月内 → 入金額(原币)，按 請求通貨
for (const [id, token] of [[env.KINTONE_APP_EXP_RECEIPTS_ID, env.KINTONE_APP_EXP_RECEIPTS_TOKEN], [env.KINTONE_APP_EC_RECEIPTS_ID, env.KINTONE_APP_EC_RECEIPTS_TOKEN]]) {
  const recs = await fetchAll(id, token);
  for (const rec of recs) {
    const cur = v(rec["請求通貨_0"]) || v(rec["請求通貨"]) || "JPY";
    for (const row of rec["入金テーブル"]?.value || []) {
      if (inMonth(v(row.value?.["入金日"]))) add(入金, cur, num(v(row.value?.["入金額"])));
    }
  }
}
// 出金：支付 支払履歴.支払日履歴 在月内 → 支払額履歴(原币)，按 支払通貨
for (const [id, token] of [[env.KINTONE_APP_EXP_PAYMENTS_ID, env.KINTONE_APP_EXP_PAYMENTS_TOKEN], [env.KINTONE_APP_EC_PAYMENTS_ID, env.KINTONE_APP_EC_PAYMENTS_TOKEN]]) {
  const recs = await fetchAll(id, token);
  for (const rec of recs) {
    const cur = v(rec["支払通貨_0"]) || v(rec["支払通貨"]) || "JPY";
    for (const row of rec["支払履歴"]?.value || []) {
      if (inMonth(v(row.value?.["支払日履歴"]))) add(出金, cur, num(v(row.value?.["支払額履歴"])));
    }
  }
}
// 贩管费出金：支払日 在月内 → 費用(原币)，按 通貨
for (const [id, token] of [[env.KINTONE_APP_SGA_JP_ID, env.KINTONE_APP_SGA_JP_TOKEN], [env.KINTONE_APP_SGA_CN_ID, env.KINTONE_APP_SGA_CN_TOKEN], [env.KINTONE_APP_SGA_EC_ID, env.KINTONE_APP_SGA_EC_TOKEN]]) {
  const recs = await fetchAll(id, token, `販管キー = "${ym.replace("-", "")}"`);
  for (const rec of recs) {
    if (inMonth(v(rec["支払日"]))) add(出金, v(rec["通貨"]) || "JPY", num(v(rec["費用"])));
  }
}

// 残高差额 by币种（从已同步 kc_bank_balance）
const H = { apikey: SKEY, Authorization: `Bearer ${SKEY}`, "Accept-Profile": "settlement", "Content-Profile": "settlement" };
const bank = await (await fetch(`${SUPA}/rest/v1/kc_bank_balance?月份=eq.${ym}&select=币种,残高差额`, { headers: H })).json();
const 残高 = new Map();
for (const b of bank) add(残高, b.币种, num(b.残高差额));

const curs = new Set([...入金.keys(), ...出金.keys(), ...残高.keys()]);
const rows = [];
for (const c of curs) {
  const i = 入金.get(c) || 0, o = 出金.get(c) || 0, net = i - o, diff = (残高.get(c) || 0) - net;
  rows.push({ 利润月: ym, 币种: c, 残高差额: Math.round(残高.get(c) || 0), 入金合计: Math.round(i), 出金合计: Math.round(o), 现金净额: Math.round(net), 差异: Math.round(diff), 状态: Math.abs(diff) < 1 ? "平" : "有差异" });
}
await fetch(`${SUPA}/rest/v1/settlement_checks?利润月=eq.${ym}`, { method: "DELETE", headers: H });
if (rows.length) await fetch(`${SUPA}/rest/v1/settlement_checks`, { method: "POST", headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(rows) });
const fmt = (n) => Math.round(n).toLocaleString();
console.log(`✅ 决算现金勾稽 ${ym}（${rows.length} 币种）`);
for (const r of rows) console.log(`  ${r.币种}: 残高差额 ${fmt(r.残高差额)} | 现金净额 ${fmt(r.现金净额)}(入${fmt(r.入金合计)}-出${fmt(r.出金合计)}) | 差异 ${fmt(r.差异)} ${r.状态}`);
