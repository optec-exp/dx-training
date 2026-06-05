// 对账逻辑验证（②.3）：解析 SOA → 按 OPT+供应商(模糊)+币种 匹配 kc_cost_lines → 出差异。
// 运行：node scripts/reconcile-test.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const l of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const t = l.trim(); if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("="); if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}
const KEY = env.GEMINI_API_KEY, SUPA = env.NEXT_PUBLIC_SUPABASE_URL, SKEY = env.SUPABASE_SERVICE_ROLE_KEY;

// 1) 解析 SOA
const b64 = readFileSync(join(root, "data/账单样本/summary05-2026.pdf")).toString("base64");
const schema = { type: "object", properties: {
  供应商: { type: "string" }, 币种: { type: "string" }, 类型: { type: "string" },
  lines: { type: "array", items: { type: "object", properties: { opt_no: { type: "string" }, 金额: { type: "number" } }, required: ["opt_no", "金额"] } },
}, required: ["供应商", "币种", "lines"] };
const gres = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: "application/pdf", data: b64 } }, { text: "提取货代成本账单：供应商(Courier名)、币种、lines(opt_no=Job No, 金额=该行TOTAL数值)。只返回JSON。" }] }], generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0 } }),
});
const bill = JSON.parse((await gres.json()).candidates[0].content.parts[0].text);

// 账单侧按 OPT 聚合（同一OPT多行求和）
const billByOpt = new Map();
for (const ln of bill.lines) billByOpt.set(ln.opt_no, (billByOpt.get(ln.opt_no) || 0) + ln.金额);

// 2) 拉 Kintone 侧成本（这些OPT，该币种）
const opts = [...billByOpt.keys()];
const H = { apikey: SKEY, Authorization: `Bearer ${SKEY}`, "Accept-Profile": "settlement" };
const inList = opts.map((o) => `"${o}"`).join(",");
const kres = await fetch(`${SUPA}/rest/v1/kc_cost_lines?opt_no=in.(${encodeURIComponent(inList)})&原币种=eq.${bill.币种}&select=opt_no,供应商,金额_原币`, { headers: H });
const kc = await kres.json();

// 供应商模糊：取拉丁字母大写比较
const latin = (s) => (s || "").toUpperCase().replace(/[^A-Z]/g, "");
const billLatin = latin(bill.供应商);
// Kintone侧按 OPT 聚合（供应商模糊匹配账单供应商 + 同币种）
const kinByOpt = new Map();
for (const r of kc) {
  const kl = latin(r.供应商);
  if (kl.includes(billLatin) || billLatin.includes(kl)) kinByOpt.set(r.opt_no, (kinByOpt.get(r.opt_no) || 0) + Number(r.金额_原币));
}

// 3) 比对
console.log(`账单：${bill.供应商} | ${bill.币种} | ${billByOpt.size}票\n`);
console.log("OPT编号        账单金额     Kintone金额   差额    状态");
let okN = 0, diffN = 0, missN = 0;
for (const [opt, bAmt] of billByOpt) {
  const kAmt = kinByOpt.get(opt);
  if (kAmt == null) { console.log(`${opt}  ${bAmt.toString().padStart(10)}        (无)              🟡缺录/缺账单`); missN++; continue; }
  const diff = bAmt - kAmt;
  const st = Math.abs(diff) < 1 ? "✅匹配" : "⚠️金额差异";
  if (Math.abs(diff) < 1) okN++; else diffN++;
  console.log(`${opt}  ${bAmt.toString().padStart(10)}  ${kAmt.toString().padStart(12)}  ${diff.toFixed(0).padStart(6)}   ${st}`);
}
console.log(`\n汇总：✅匹配 ${okN}   ⚠️差异 ${diffN}   🟡缺 ${missN}   / 共 ${billByOpt.size} 票`);
