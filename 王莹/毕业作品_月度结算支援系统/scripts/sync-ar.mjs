// 应收账龄同步（⑦）：请求入金(1010/1012) 未入金 → settlement.ar_ap_aging。
// 账龄按 支払期日 相对基准日(默认2026-06-05)。运行：node scripts/sync-ar.mjs 2026-06-05
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
const refStr = process.argv[2] || "2026-06-05";
const ref = new Date(refStr + "T00:00:00+09:00");
const v = (f) => (f && f.value != null && typeof f.value !== "object" ? f.value : "");
const num = (f) => { const x = parseFloat(v(f)); return Number.isFinite(x) ? x : 0; };

async function fetchOutstanding(id, token) {
  const out = []; let lastId = 0;
  for (;;) {
    const q = `円換算差額未入金 > 1 and $id > ${lastId} order by $id asc limit 500`;
    const r = await fetch(`${KBASE}/k/v1/records.json?app=${id}&query=${encodeURIComponent(q)}`, { headers: { "X-Cybozu-API-Token": token } });
    if (!r.ok) throw new Error(`app ${id}: ${r.status} ${await r.text()}`);
    const { records } = await r.json();
    out.push(...records);
    if (records.length < 500) break;
    lastId = Number(records[records.length - 1]["$id"].value);
  }
  return out;
}

const rows = [];
for (const [id, token] of [[env.KINTONE_APP_EXP_RECEIPTS_ID, env.KINTONE_APP_EXP_RECEIPTS_TOKEN], [env.KINTONE_APP_EC_RECEIPTS_ID, env.KINTONE_APP_EC_RECEIPTS_TOKEN]]) {
  const recs = await fetchOutstanding(id, token);
  for (const rec of recs) {
    const amt = num(rec["円換算差額未入金"]);
    if (amt <= 1) continue;
    const due = v(rec["支払期日"]);
    let daysOver = 0;
    if (due) daysOver = Math.floor((ref - new Date(due + "T00:00:00+09:00")) / 86400000);
    const overdue = daysOver > 0;
    const bucket = daysOver <= 30 ? "0-30" : daysOver <= 60 ? "31-60" : daysOver <= 90 ? "61-90" : "90+";
    rows.push({ 期间: refStr, 类型: "应收", 客户供应商: v(rec["顧客名"]), 金额: amt, 账龄桶: bucket, 是否超期: overdue });
  }
}

const H = { apikey: SKEY, Authorization: `Bearer ${SKEY}`, "Content-Profile": "settlement" };
await fetch(`${SUPA}/rest/v1/ar_ap_aging?类型=eq.应收`, { method: "DELETE", headers: H });
for (let i = 0; i < rows.length; i += 200) {
  const w = await fetch(`${SUPA}/rest/v1/ar_ap_aging`, { method: "POST", headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(rows.slice(i, i + 200)) });
  if (!w.ok) throw new Error(`写 ar_ap_aging ${w.status}: ${await w.text()}`);
}
const fmt = (n) => Math.round(n).toLocaleString();
const total = rows.reduce((s, r) => s + r.金额, 0);
const over = rows.filter((r) => r.是否超期);
console.log(`✅ 应收账龄(基准 ${refStr})：${rows.length} 笔，合计 ¥${fmt(total)}，超期 ${over.length} 笔 ¥${fmt(over.reduce((s, r) => s + r.金额, 0))}`);
