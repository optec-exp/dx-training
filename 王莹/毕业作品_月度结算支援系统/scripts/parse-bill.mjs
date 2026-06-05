// 账单 AI 解析测试（②.2）：Gemini 多模态读 PDF → responseSchema 结构化。
// 运行：node scripts/parse-bill.mjs "data/账单样本/summary05-2026.pdf"
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const l of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const t = l.trim(); if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("="); if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}
const KEY = env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash"; // 文档解析用 2.5-flash（免费层约20/天）

const file = process.argv[2] || "data/账单样本/summary05-2026.pdf";
const b64 = readFileSync(join(root, file)).toString("base64");

const schema = {
  type: "object",
  properties: {
    供应商: { type: "string", description: "Courier Full Name / 收款人 / 供应商名" },
    币种: { type: "string", description: "Subtotal 标注的货币，如 HKD/USD/JPY" },
    类型: { type: "string", enum: ["单票", "SOA"] },
    账单日期: { type: "string" },
    lines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          opt_no: { type: "string", description: "Job No.，即 OPT 编号，如 OPT2607139" },
          routing: { type: "string" },
          date: { type: "string" },
          金额: { type: "number", description: "该行 TOTAL 金额（原币种）" },
        },
        required: ["opt_no", "金额"],
      },
    },
  },
  required: ["供应商", "币种", "类型", "lines"],
};

const prompt = `这是一张国际货代的成本账单（快递员/供应商费用清单）。请提取结构化数据：
- 供应商：Courier Full Name 或收款人名称
- 币种：Subtotal 处标注的货币代码
- 类型：只有 1 个 Job No. 为"单票"，多个 Job No. 为"SOA"
- lines：每一行明细，opt_no 取 Job No.(OPT编号)，金额取该行 TOTAL（原币种数值，不含货币符号和千分位逗号）
只返回 JSON。`;

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{ parts: [{ inline_data: { mime_type: "application/pdf", data: b64 } }, { text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0 },
  }),
});
if (!res.ok) { console.error("❌", res.status, await res.text()); process.exit(1); }
const data = await res.json();
const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
const parsed = JSON.parse(text);
console.log(`文件: ${file}`);
console.log(`供应商: ${parsed.供应商} | 币种: ${parsed.币种} | 类型: ${parsed.类型} | 行数: ${parsed.lines.length}`);
let sum = 0;
for (const ln of parsed.lines) { console.log(`  ${ln.opt_no}  ${ln.routing || ""}  ${ln.date || ""}  ${ln.金额}`); sum += ln.金额; }
console.log(`合计: ${sum.toLocaleString()}`);
