// 贩管费同步（B.4）：3个贩管费App的 部署按分 子表 → settlement.sg_a_lines。
// 只读拉 Kintone；费用类型归一5类；部署→地域按清单映射(不碰法人区分)，清单外标"未映射"。
// 运行：node scripts/sync-sga.mjs 2026-05

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
// 权责发生制：按【取引日(费用实际发生日)】归月，而非 販管キー(=支払日/现金口径)。
const [Y, MO] = ym.split("-").map(Number);
const LAST = String(new Date(Y, MO, 0).getDate()).padStart(2, "0");
const dateFilter = `取引日 >= "${ym}-01" and 取引日 <= "${ym}-${LAST}"`;

const APPS = [
  ["贩管费日本", env.KINTONE_APP_SGA_JP_ID, env.KINTONE_APP_SGA_JP_TOKEN],
  ["中国贩管费", env.KINTONE_APP_SGA_CN_ID, env.KINTONE_APP_SGA_CN_TOKEN],
  ["EC贩管费", env.KINTONE_APP_SGA_EC_ID, env.KINTONE_APP_SGA_EC_TOKEN],
];

// 费用类型归一 → 5 类（含 税金/对象外=除外类）
const FEE_MAP = {
  人件費: "人件費", 人工费: "人件費",
  事業活動費: "事業活動費", 业务活动费: "事業活動費",
  事業維持費: "事業維持費", 业务维持费: "事業維持費",
  "人材·IT投資": "人材·IT投資", 人才与IT投资: "人材·IT投資",
  役員関連費用: "役員関連費用",
  税金: "税金", 对象外: "对象外",
};
// 部署→地域：仅按王莹清单 + （中国）后缀；清单外=未映射
const CN_DEPTS = new Set(["OS課", "総務人事室", "財務室", "管理部", "DX室（中国）", "海外開発室", "業務開発室", "物流開発室", "Project室", "Japan Desk課", "業務財務室", "上海支店", "Marketing", "治理室", "GC課"]);
const JP_DEPTS = new Set(["TCC課", "通関課", "営業課", "業務課", "総務課"]);
function deptRegion(d) {
  if (CN_DEPTS.has(d)) return "中国";
  if (JP_DEPTS.has(d)) return "日本";
  if (/（中国）|\(中国\)/.test(d)) return "中国";
  return null; // 未映射
}

const v = (f) => (f && f.value != null ? f.value : "");
const checked = (f) => Array.isArray(f?.value) && f.value.length > 0;

async function fetchMonth(id, token) {
  const out = []; let lastId = 0;
  for (;;) {
    const q = `${dateFilter} and $id > ${lastId} order by $id asc limit 500`;
    const res = await fetch(`${KBASE}/k/v1/records.json?app=${id}&query=${encodeURIComponent(q)}`, { headers: { "X-Cybozu-API-Token": token } });
    if (!res.ok) throw new Error(`Kintone ${id}: ${res.status} ${await res.text()}`);
    const { records } = await res.json();
    out.push(...records);
    if (records.length < 500) break;
    lastId = Number(records[records.length - 1]["$id"].value);
  }
  return out;
}

const rows = [];
const unmapped = new Map(); // 部署名 → 金额合计
let kept = 0, excluded = 0;
for (const [label, id, token] of APPS) {
  const records = await fetchMonth(id, token);
  let appRows = 0;
  for (const r of records) {
    const rawFee = v(r["費用类型"]) || v(r["費用類型"]);
    const fee = FEE_MAP[rawFee] || rawFee || "(未知)";
    const isExcluded = fee === "税金" || fee === "对象外" || checked(r["集計対象外"]) || checked(r["収入項目ですか"]);
    const sub = r["部署按分"]?.value || [];
    let allocated = 0;
    for (const row of sub) {
      const amt = parseFloat(v(row.value?.["部署按分費用JPY"])) || 0;
      if (!amt) continue; // 只抓有按分费用的行，金额=0 忽略
      // 部署名优先；为空时回退 部署キー(去 日本/中国 前缀)
      let d = String(v(row.value?.["部署名"])).trim();
      if (!d) d = String(v(row.value?.["部署キー"])).replace(/^(日本|中国)/, "").trim();
      const region = deptRegion(d);
      rows.push({ source_app: String(id), 期间: ym, region, 部门: d, 费用类型: fee, 是否除外: isExcluded, 金额: amt, 分摊到小组: d });
      if (!isExcluded) {
        if (region === null) unmapped.set(d, (unmapped.get(d) || 0) + amt);
        kept += amt;
      } else excluded += amt;
      appRows++;
      allocated += amt;
    }
    // 役員関連費用=公司级(无部署按分,5/5中日)→用记录级 円換算費用 兜底捞
    if (allocated === 0 && fee === "役員関連費用") {
      const recAmt = parseFloat(v(r["円換算費用"])) || 0;
      if (recAmt !== 0) {
        rows.push({ source_app: String(id), 期间: ym, region: null, 部门: "", 费用类型: fee, 是否除外: isExcluded, 金额: recAmt, 分摊到小组: "" });
        if (!isExcluded) kept += recAmt; else excluded += recAmt;
        appRows++;
      }
    }
  }
  console.log(`  ${label} (app=${id}): ${records.length} 记录 → ${appRows} 行`);
}

// 删旧 + 写新
await fetch(`${SUPA}/rest/v1/sg_a_lines?期间=eq.${ym}`, { method: "DELETE", headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}`, "Content-Profile": "settlement" } });
for (let i = 0; i < rows.length; i += 200) {
  const res = await fetch(`${SUPA}/rest/v1/sg_a_lines`, {
    method: "POST",
    headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}`, "Content-Type": "application/json", "Content-Profile": "settlement", Prefer: "return=minimal" },
    body: JSON.stringify(rows.slice(i, i + 200)),
  });
  if (!res.ok) throw new Error(`upsert ${res.status}: ${await res.text()}`);
}
const fmt = (n) => "¥" + Math.round(n).toLocaleString("ja-JP");
console.log(`\n写入 sg_a_lines ${rows.length} 行（${ym}）`);
console.log(`贩管费(计入净利) = ${fmt(kept)}   除外(税金/对象外) = ${fmt(excluded)}`);
if (unmapped.size) {
  console.log(`\n⚠️ 未映射部署（需你确认归中国/日本），共 ${unmapped.size} 个：`);
  for (const [d, amt] of [...unmapped].sort((a, b) => b[1] - a[1])) console.log(`   ${d}  ${fmt(amt)}`);
} else console.log("\n✅ 所有部署均已映射地域");
