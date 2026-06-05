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
const H = { apikey: SKEY, Authorization: `Bearer ${SKEY}`, "Accept-Profile": "settlement" };
// 有提单号的案件数
const r1 = await fetch(`${SUPA}/rest/v1/kc_cases?提单号=not.is.null&select=opt_no,提单号&limit=10`, { headers: H });
const has = await r1.json();
const r2 = await fetch(`${SUPA}/rest/v1/kc_cases?提单号=not.is.null&select=opt_no`, { headers: { ...H, Prefer: "count=exact", Range: "0-0" } });
console.log("有提单号的案件数:", r2.headers.get("content-range"));
console.log("样本:", has.map(x => `${x.opt_no}→${x.提单号}`).join(" | "));
// 截图中的单号能否命中提单号
const norm = s => (s||"").toUpperCase().replace(/[^0-9A-Z]/g,"");
const probes = ["205-33595601","STYAE26050423","STYAE26050568","STYAE26050569"];
const all = await (await fetch(`${SUPA}/rest/v1/kc_cases?提单号=not.is.null&select=opt_no,提单号&limit=1000`, { headers: H })).json();
const map = new Map(all.map(x => [norm(x.提单号), x.opt_no]));
for (const p of probes) console.log(`  ${p} → ${map.get(norm(p)) || "未命中"}`);
// OPT2606164 的成本明细
const cl = await (await fetch(`${SUPA}/rest/v1/kc_cost_lines?opt_no=eq.OPT2606164&select=供应商,原币种,金额_原币`, { headers: H })).json();
console.log("OPT2606164 成本:", JSON.stringify(cl));
