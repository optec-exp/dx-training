// 支付明细同步（②.1）：支付App(EXP1013/EC1015)的 支払明細 子表 → settlement.kc_cost_lines。
// 作为对账的 Kintone 成本侧基准（按 OPT+供应商 聚合，原币种）。
// 运行：node scripts/sync-payments.mjs 2026-05

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
const [yy, mm] = ym.split("-").map(Number);
const pad = (x) => String(x).padStart(2, "0");
const from = `${yy}-${pad(mm)}-01`;
const to = mm === 12 ? `${yy + 1}-01-01` : `${yy}-${pad(mm + 1)}-01`;

const APPS = [
  ["EXP支付", env.KINTONE_APP_EXP_PAYMENTS_ID, env.KINTONE_APP_EXP_PAYMENTS_TOKEN, "EXPRESS"],
  ["EC支付", env.KINTONE_APP_EC_PAYMENTS_ID, env.KINTONE_APP_EC_PAYMENTS_TOKEN, "TRADING"],
];
const v = (f) => (f && f.value != null && typeof f.value !== "object" ? f.value : "");
const n = (f) => { const x = parseFloat(v(f)); return Number.isFinite(x) ? x : null; };

async function fetchMonth(id, token) {
  const out = []; let lastId = 0;
  for (;;) {
    const q = `取引日 >= "${from}" and 取引日 < "${to}" and $id > ${lastId} order by $id asc limit 500`;
    const res = await fetch(`${KBASE}/k/v1/records.json?app=${id}&query=${encodeURIComponent(q)}`, { headers: { "X-Cybozu-API-Token": token } });
    if (!res.ok) throw new Error(`${id}: ${res.status} ${await res.text()}`);
    const { records } = await res.json();
    out.push(...records);
    if (records.length < 500) break;
    lastId = Number(records[records.length - 1]["$id"].value);
  }
  return out;
}

const rows = [];
const optSet = new Set();
for (const [label, id, token, company] of APPS) {
  if (!id) { console.log(`  ${label}: 无配置，跳过`); continue; }
  const records = await fetchMonth(id, token);
  let cnt = 0;
  for (const r of records) {
    const topOpt = v(r["当社案件番号"]);
    const sub = r["支払明細"]?.value || [];
    for (const row of sub) {
      const opt = v(row.value?.["当社案件番号_明細"]) || topOpt;
      const amt = n(row.value?.["支払額_税込"]);
      if (!opt || amt == null) continue;
      optSet.add(opt);
      rows.push({
        opt_no: opt,
        供应商: v(row.value?.["支払先_0"]) || v(r["支払先"]),
        费用科目: v(row.value?.["支払項目"]),
        原币种: v(row.value?.["支払通貨"]),
        金额_原币: amt,
        金额_日元: n(row.value?.["円換算支払額"]),
        金额_人民币: n(row.value?.["元換算支払額"]),
      });
      cnt++;
    }
  }
  console.log(`  ${label} (app=${id}): ${records.length} 记录 → ${cnt} 明细行`);
}

// 删旧(按本次涉及 opt) + 写新
const opts = [...optSet];
const H = { apikey: SKEY, Authorization: `Bearer ${SKEY}`, "Content-Profile": "settlement" };
for (let i = 0; i < opts.length; i += 100) {
  const inList = opts.slice(i, i + 100).map((o) => `"${o}"`).join(",");
  await fetch(`${SUPA}/rest/v1/kc_cost_lines?opt_no=in.(${encodeURIComponent(inList)})`, { method: "DELETE", headers: H });
}
for (let i = 0; i < rows.length; i += 200) {
  const res = await fetch(`${SUPA}/rest/v1/kc_cost_lines`, {
    method: "POST",
    headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(rows.slice(i, i + 200)),
  });
  if (!res.ok) throw new Error(`写 kc_cost_lines ${res.status}: ${await res.text()}`);
}
console.log(`\n✅ 写入 kc_cost_lines ${rows.length} 行，涉及 ${opts.length} 票 OPT`);
