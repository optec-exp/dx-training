import { readFileSync } from "node:fs"; import { fileURLToPath } from "node:url"; import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {}; for (const l of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) { const t=l.trim(); if(!t||t.startsWith("#"))continue; const i=t.indexOf("="); if(i>0)env[t.slice(0,i).trim()]=t.slice(i+1).trim(); }
const SUPA=env.NEXT_PUBLIC_SUPABASE_URL, SKEY=env.SUPABASE_SERVICE_ROLE_KEY;
const H={apikey:SKEY,Authorization:`Bearer ${SKEY}`,"Accept-Profile":"settlement"};
const recon = await (await fetch(`${SUPA}/rest/v1/reconciliations?利润月=eq.2026-05&select=opt_no,供应商,账单金额_原币,差异类型,状态&order=created_at`, {headers:H})).json();
console.log("reconciliations(2026-05):", recon.length, "行");
recon.forEach(r=>console.log("  ",r.opt_no,r.供应商?.slice(0,18),r.账单金额_原币,r.差异类型,r.状态));
const bills = await (await fetch(`${SUPA}/rest/v1/bills?利润月=eq.2026-05&select=供应商,账单总额_原币,原币种&order=created_at`, {headers:H})).json();
console.log("bills(2026-05):", bills.length, "张:", bills.map(b=>`${b.供应商?.slice(0,12)}/${b.账单总额_原币}${b.原币种}`).join(" | "));
