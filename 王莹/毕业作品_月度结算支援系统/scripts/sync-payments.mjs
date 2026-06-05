// 成本明细同步（②对账 Kintone 成本侧基准）：案件App(AIR/SEA/EC) 的「支払テーブル」子表 → settlement.kc_cost_lines。
// 口径 = 利润月（AIR/SEA=請求日, EC=纳品完了日），権責制：覆盖该利润月案件的**全部应付成本**（不论是否已付款）。
//   ↑ 旧版接的是「支付App·取引日(付款日)」现金口径，会漏掉"利润月在本月、付款日不在本月/未付款"的成本，导致账单对不上。
// 按 OPT+供应商 聚合、原币种。运行：node scripts/sync-payments.mjs 2026-05

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

// 案件App（成本在案件自身的「支払テーブル」子表里）
const APPS = [
  ["AIR", env.KINTONE_APP_AIR_CASES_ID, env.KINTONE_APP_AIR_CASES_TOKEN, "請求日"],
  ["SEA", env.KINTONE_APP_SEA_CASES_ID, env.KINTONE_APP_SEA_CASES_TOKEN, "請求日"],
  ["EC", env.KINTONE_APP_EC_CASES_ID, env.KINTONE_APP_EC_CASES_TOKEN, "纳品完了日"],
];
const v = (f) => (f && f.value != null && typeof f.value !== "object" ? f.value : "");
const n = (f) => { const x = parseFloat(v(f)); return Number.isFinite(x) ? x : null; };

async function fetchMonth(id, token, tf) {
  const out = []; let lastId = 0;
  for (;;) {
    const q = `${tf} >= "${from}" and ${tf} < "${to}" and $id > ${lastId} order by $id asc limit 200`;
    const res = await fetch(`${KBASE}/k/v1/records.json?app=${id}&query=${encodeURIComponent(q)}`, { headers: { "X-Cybozu-API-Token": token } });
    if (!res.ok) throw new Error(`${id}: ${res.status} ${await res.text()}`);
    const { records } = await res.json();
    out.push(...records);
    if (records.length < 200) break;
    lastId = Number(records[records.length - 1]["$id"].value);
  }
  return out;
}

const rows = [];
const optSet = new Set();
for (const [label, id, token, tf] of APPS) {
  if (!id) { console.log(`  ${label}: 无配置，跳过`); continue; }
  const records = await fetchMonth(id, token, tf);
  let cnt = 0;
  for (const r of records) {
    const opt = v(r["当社案件番号"]);
    if (!opt) continue;
    const sub = r["支払テーブル"]?.value || [];
    for (const row of sub) {
      const amt = n(row.value?.["支払額_税込"]);
      if (amt == null) continue;
      // 排除明确非"支払"类型的子表行（项目种别为空时保留）
      const 类型 = v(row.value?.["項目種別_支払"]);
      if (类型 && 类型 !== "支払") continue;
      optSet.add(opt);
      rows.push({
        opt_no: opt,
        供应商: v(row.value?.["支払先_0"]),
        费用科目: v(row.value?.["支払項目"]),
        原币种: v(row.value?.["支払通貨"]),
        金额_原币: amt,
        金额_日元: n(row.value?.["円換算支払額"]),
        金额_人民币: n(row.value?.["元換算支払額"]),
      });
      cnt++;
    }
  }
  console.log(`  ${label} (app=${id}): ${records.length} 案件 → ${cnt} 成本行`);
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
console.log(`\n✅ 写入 kc_cost_lines ${rows.length} 行，涉及 ${opts.length} 票 OPT（口径=利润月·案件支払テーブル）`);
