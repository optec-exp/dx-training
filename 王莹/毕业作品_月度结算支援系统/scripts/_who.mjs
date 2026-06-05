import { readFileSync } from "node:fs"; import { fileURLToPath } from "node:url"; import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {}; for (const l of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) { const t=l.trim(); if(!t||t.startsWith("#"))continue; const i=t.indexOf("="); if(i>0)env[t.slice(0,i).trim()]=t.slice(i+1).trim(); }
const SUPA=env.NEXT_PUBLIC_SUPABASE_URL, SKEY=env.SUPABASE_SERVICE_ROLE_KEY;
const H={apikey:SKEY,Authorization:`Bearer ${SKEY}`,"Accept-Profile":"settlement"};
console.log("=== bills 创建时间 ===");
const bills=await(await fetch(`${SUPA}/rest/v1/bills?select=供应商,账单总额_原币,created_at&order=created_at`,{headers:H})).json();
bills.forEach(b=>console.log(`  ${b.created_at} ${b.供应商?.slice(0,14)} ${b.账单总额_原币}`));
console.log("\n=== reconciliations 全部(含创建时间) ===");
const rc=await(await fetch(`${SUPA}/rest/v1/reconciliations?select=opt_no,供应商,账单金额_原币,差异类型,created_at&order=created_at`,{headers:H})).json();
rc.forEach(r=>console.log(`  ${r.created_at} ${r.opt_no} ${r.供应商?.slice(0,12)} ${r.账单金额_原币} ${r.差异类型}`));
