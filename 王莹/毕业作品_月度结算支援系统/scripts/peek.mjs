// 通用查看：打印某表行数 + 几条样本（settlement schema）。
// 运行：node scripts/peek.mjs kc_cases [limit]
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}
const SUPA = env.NEXT_PUBLIC_SUPABASE_URL, SKEY = env.SUPABASE_SERVICE_ROLE_KEY;
const table = process.argv[2] || "kc_cases";
const limit = process.argv[3] || "2";
const H = { apikey: SKEY, Authorization: `Bearer ${SKEY}`, "Accept-Profile": "settlement" };

const cRes = await fetch(`${SUPA}/rest/v1/${table}?select=*`, {
  headers: { ...H, Prefer: "count=exact", Range: "0-0" },
});
console.log(`${table} 行数:`, cRes.headers.get("content-range"));

const res = await fetch(`${SUPA}/rest/v1/${table}?select=*&limit=${limit}`, { headers: H });
const rows = await res.json();
for (const r of rows) {
  console.log("—".repeat(40));
  for (const [k, v] of Object.entries(r)) {
    if (v !== null && v !== "" && k !== "id" && k !== "synced_at") console.log(`  ${k}: ${v}`);
  }
}
