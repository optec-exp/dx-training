// 银行残高同步：银行残高管理(291) → settlement.kc_bank_balance（按月 年月=YYYYMM）。
// 运行：node scripts/sync-bank.mjs 2026-05
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
const key = ym.replace("-", "");
const id = env.KINTONE_APP_BANK_BALANCE_ID, token = env.KINTONE_APP_BANK_BALANCE_TOKEN;
const v = (f) => (f && f.value != null && typeof f.value !== "object" ? f.value : "");
const n = (f) => { const x = parseFloat(v(f)); return Number.isFinite(x) ? x : null; };

const q = `年月 = "${key}" order by $id asc limit 500`;
const res = await fetch(`${KBASE}/k/v1/records.json?app=${id}&query=${encodeURIComponent(q)}`, { headers: { "X-Cybozu-API-Token": token } });
if (!res.ok) { console.error("❌", res.status, await res.text()); process.exit(1); }
const { records } = await res.json();
const rows = records.map((r) => ({
  银行: v(r["銀行"]), 币种: v(r["通貨"]), 月份: ym,
  期初残高: n(r["前月末残高"]), 期末残高: n(r["残高"]), 残高差额: n(r["差額"]),
}));

const H = { apikey: SKEY, Authorization: `Bearer ${SKEY}`, "Content-Profile": "settlement" };
await fetch(`${SUPA}/rest/v1/kc_bank_balance?月份=eq.${ym}`, { method: "DELETE", headers: H });
if (rows.length) {
  const w = await fetch(`${SUPA}/rest/v1/kc_bank_balance`, { method: "POST", headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(rows) });
  if (!w.ok) { console.error("写入失败", w.status, await w.text()); process.exit(1); }
}
console.log(`✅ 银行残高 ${ym}：写入 ${rows.length} 条`);
const byCur = {};
for (const r of rows) byCur[r.币种] = (byCur[r.币种] || 0) + (r.残高差额 || 0);
console.log("按币种残高差额：", Object.entries(byCur).map(([c, a]) => `${c} ${Math.round(a).toLocaleString()}`).join("  "));
