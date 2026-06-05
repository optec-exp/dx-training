// 贩管费结构探查（只读）：3 个 App 的 费用类型 / 部署按分.部署名 / 期间字段 distinct 值。
// 运行：node scripts/inspect-sga.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const l of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const t = l.trim(); if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("="); if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}
const KBASE = env.KINTONE_BASE_URL;
const APPS = [
  ["贩管费日本", env.KINTONE_APP_SGA_JP_ID, env.KINTONE_APP_SGA_JP_TOKEN],
  ["中国贩管费", env.KINTONE_APP_SGA_CN_ID, env.KINTONE_APP_SGA_CN_TOKEN],
  ["EC贩管费", env.KINTONE_APP_SGA_EC_ID, env.KINTONE_APP_SGA_EC_TOKEN],
];
const v = (f) => (f && f.value != null ? f.value : "");

for (const [label, id, token] of APPS) {
  console.log(`\n========== ${label} (app=${id}) ==========`);
  // 取最近 300 条扫描 distinct
  const url = `${KBASE}/k/v1/records.json?app=${id}&query=${encodeURIComponent("order by $id desc limit 300")}`;
  const res = await fetch(url, { headers: { "X-Cybozu-API-Token": token } });
  if (!res.ok) { console.log("  ❌", res.status, await res.text()); continue; }
  const { records } = await res.json();
  const r0 = records[0] || {};
  // 顶层字段名里找"期间/费用类型/除外"相关
  console.log("  顶层字段含 键词:", Object.keys(r0).filter((k) => /販管キー|費用类型|費用類型|税区分|集計対象外|収入項目|支払日|取引日|按分/.test(k)).join(", "));
  const subKey = Object.keys(r0).find((k) => r0[k]?.type === "SUBTABLE" && /部署按分/.test(k))
    || Object.keys(r0).find((k) => r0[k]?.type === "SUBTABLE");
  console.log("  部署按分子表字段名:", subKey);
  if (subKey && r0[subKey]?.value?.[0]?.value) console.log("    子字段:", Object.keys(r0[subKey].value[0].value).join(", "));

  const feeTypes = new Set(), depts = new Set(), periods = new Set();
  for (const r of records) {
    const ft = v(r["費用类型"]) || v(r["費用類型"]); if (ft) feeTypes.add(ft);
    const pk = v(r["販管キー"]); if (pk) periods.add(pk);
    const sub = subKey ? r[subKey]?.value || [] : [];
    for (const row of sub) { const d = v(row.value?.["部署名"]); if (d) depts.add(d); }
  }
  console.log("  費用类型 distinct:", [...feeTypes].join(" | ") || "(无)");
  console.log("  期间(販管キー) distinct:", [...periods].slice(0, 8).join(" ") || "(无)");
  console.log("  部署名 distinct:", [...depts].join(" | ") || "(无)");
}
console.log("\n完成。");
