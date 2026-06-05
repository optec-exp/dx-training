// 三App同步排查（④）：案件App 收入/成本 vs 请求入金/支付App 合计，按 OPT 比对。
// 检测同步bug。运行：node scripts/sync-check.mjs 2026-05
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
const H = { apikey: SKEY, Authorization: `Bearer ${SKEY}`, "Accept-Profile": "settlement", "Content-Profile": "settlement" };
const v = (f) => (f && f.value != null && typeof f.value !== "object" ? f.value : "");
const num = (f) => { const x = parseFloat(v(f)); return Number.isFinite(x) ? x : 0; };

// 1) 案件
const cres = await fetch(`${SUPA}/rest/v1/kc_cases?select=opt_no,company,売上_日元,成本_日元&利润月=eq.${ym}&limit=5000`, { headers: H });
const cases = await cres.json();
const caseMap = new Map(cases.map((c) => [c.opt_no, c]));
const opts = [...caseMap.keys()];

// 2) Kintone 入金/支付按 OPT 汇总（円換算売上合計 / 円換算費用合計）
async function sumByOpt(appId, token, sumField) {
  const map = new Map();
  for (let i = 0; i < opts.length; i += 100) {
    const inList = opts.slice(i, i + 100).map((o) => `"${o}"`).join(",");
    const q = `当社案件番号 in (${inList}) order by $id asc limit 500`;
    const r = await fetch(`${KBASE}/k/v1/records.json?app=${appId}&query=${encodeURIComponent(q)}`, { headers: { "X-Cybozu-API-Token": token } });
    if (!r.ok) throw new Error(`app ${appId}: ${r.status} ${await r.text()}`);
    const { records } = await r.json();
    for (const rec of records) {
      const opt = v(rec["当社案件番号"]);
      map.set(opt, (map.get(opt) || 0) + num(rec[sumField]));
    }
  }
  return map;
}
const 入金 = new Map([
  ...(await sumByOpt(env.KINTONE_APP_EXP_RECEIPTS_ID, env.KINTONE_APP_EXP_RECEIPTS_TOKEN, "円換算売上合計")),
  ...(await sumByOpt(env.KINTONE_APP_EC_RECEIPTS_ID, env.KINTONE_APP_EC_RECEIPTS_TOKEN, "円換算売上合計")),
]);
const 支付 = new Map([
  ...(await sumByOpt(env.KINTONE_APP_EXP_PAYMENTS_ID, env.KINTONE_APP_EXP_PAYMENTS_TOKEN, "円換算費用合計")),
  ...(await sumByOpt(env.KINTONE_APP_EC_PAYMENTS_ID, env.KINTONE_APP_EC_PAYMENTS_TOKEN, "円換算費用合計")),
]);

// 3) 比对
const rows = [];
let revMis = 0, costMis = 0;
for (const [opt, c] of caseMap) {
  const caseRev = num({ value: c["売上_日元"] }), caseCost = num({ value: c["成本_日元"] });
  const inSum = 入金.get(opt) || 0, paySum = 支付.get(opt) || 0;
  const revDiff = Math.round(caseRev - inSum), costDiff = Math.round(caseCost - paySum);
  const bad = Math.abs(revDiff) > 1 || Math.abs(costDiff) > 1;
  if (Math.abs(revDiff) > 1) revMis++;
  if (Math.abs(costDiff) > 1) costMis++;
  rows.push({ opt_no: opt, company: c.company, 利润月: ym, 案件收入: caseRev, 入金合计: inSum, 收入差异: revDiff, 案件成本: caseCost, 支付合计: paySum, 成本差异: costDiff, 状态: bad ? "差异" : "一致" });
}

// 4) 写 sync_checks
await fetch(`${SUPA}/rest/v1/sync_checks?利润月=eq.${ym}`, { method: "DELETE", headers: H });
for (let i = 0; i < rows.length; i += 200) {
  const w = await fetch(`${SUPA}/rest/v1/sync_checks`, { method: "POST", headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(rows.slice(i, i + 200)) });
  if (!w.ok) throw new Error(`写 sync_checks ${w.status}: ${await w.text()}`);
}
const fmt = (n) => Math.round(n).toLocaleString();
const sum = (m) => [...m.values()].reduce((s, x) => s + x, 0);
console.log(`三App同步排查 ${ym}：${rows.length} 票`);
console.log(`总收入 案件 ${fmt([...caseMap.values()].reduce((s, c) => s + num({ value: c.売上_日元 }), 0))} vs 入金 ${fmt(sum(入金))}`);
console.log(`总成本 案件 ${fmt([...caseMap.values()].reduce((s, c) => s + num({ value: c.成本_日元 }), 0))} vs 支付 ${fmt(sum(支付))}`);
console.log(`收入不一致 ${revMis} 票，成本不一致 ${costMis} 票`);
