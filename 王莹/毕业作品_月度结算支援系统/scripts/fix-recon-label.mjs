// 一次性：把旧的误导标签 差异类型="缺账单" → "漏录或同步异常"（账单有、Kintone无对应）
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const l of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const t = l.trim(); if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("="); if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}
const SUPA = env.NEXT_PUBLIC_SUPABASE_URL, SKEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: SKEY, Authorization: `Bearer ${SKEY}`, "Content-Type": "application/json", "Content-Profile": "settlement", "Accept-Profile": "settlement", Prefer: "return=representation" };

const res = await fetch(`${SUPA}/rest/v1/reconciliations?差异类型=eq.${encodeURIComponent("缺账单")}`, {
  method: "PATCH", headers: H, body: JSON.stringify({ 差异类型: "漏录或同步异常" }),
});
const data = await res.json();
console.log("更新行数:", Array.isArray(data) ? data.length : data);
