// Gemini 免费层：多模态读账单 PDF → responseSchema 结构化。
// 将来换 Claude API：只替换本文件。

// 主模型 + 降级备用（过载/限流时自动切换）。
const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-latest"];

export interface ParsedBillLine {
  opt_no?: string;
  提单号?: string;
  routing?: string;
  date?: string;
  金额: number;
}
export interface ParsedBill {
  供应商: string;
  币种: string;
  类型: "单票" | "SOA";
  账单日期?: string;
  lines: ParsedBillLine[];
}

const SCHEMA = {
  type: "object",
  properties: {
    供应商: { type: "string", description: "出具这张账单的公司=向我方收费的承运商(账单落款/抬头/FROM/公司LOGO处)。注意：不是 TO/收件方/开票抬头/客户" },
    币种: { type: "string", description: "费用货币代码，如 RMB/CNY/HKD/USD/JPY" },
    类型: { type: "string", enum: ["单票", "SOA"] },
    账单日期: { type: "string" },
    lines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          opt_no: { type: "string", description: "该行的 OPT 编号(形如 OPTxxxxxxx)。可能在品名/业务编号/Job No等任意列,按编号规律识别;无则留空" },
          提单号: { type: "string", description: "该行的运单号/提单号(MAWB NO./HAWB/AWB/BL No./运单号,如 205-33595601),可能在运单号或MAWB列;无则留空" },
          routing: { type: "string" },
          date: { type: "string" },
          金额: { type: "number", description: "该行的总价/总运费/TOTAL(原币种数值,去符号和千分位)" },
        },
        required: ["金额"],
      },
    },
  },
  required: ["供应商", "币种", "类型", "lines"],
};

const PROMPT = `这是一张国际货代的成本账单（供应商向我方收费）。提取结构化数据：
- 供应商：**出具/落款这张账单的公司**（公司抬头、LOGO、"收入费用确认书"的 FROM、落款方），即向我方开票收费的承运商。**绝不要取 TO/收件方/开票抬头/客户 那个公司名**。
- 币种：费用货币代码（RMB/CNY/HKD/USD/JPY 等）。
- 类型：只对应 1 票货（1 个 OPT/运单号）为"单票"，多票为"SOA"。
- lines：每行费用明细：
  - opt_no：该行的 OPT 编号（形如 OPTxxxxxxx）。**编号可能写在"品名/业务编号"等任意列里，请按"OPT+数字"的规律识别，不要受列名限制**；若整票只有一个 OPT/业务编号在表头，则每行都用它；没有 OPT 就留空。
  - 提单号：该行的运单号/提单号（"运单号"列或"MAWB NO."，形如 205-33595601）；单票时表头的 MAWB 用于每行；没有就留空。
  - 金额：该行 总价/总运费/TOTAL（原币种数值，去货币符号和千分位逗号）。
只返回 JSON。`;

// 纯文本生成（月报点评等），同样带降级重试。
export async function generateText(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("缺少 GEMINI_API_KEY");
  const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } });
  let lastErr = "";
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body,
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text as string;
        throw new Error("Gemini 未返回内容");
      }
      lastErr = `${res.status} ${await res.text()}`;
      if (res.status === 503 || res.status === 429) { await new Promise((r) => setTimeout(r, 1500)); continue; }
      break;
    }
  }
  throw new Error(`Gemini 生成失败（已重试/降级）：${lastErr}`);
}

export async function parseBillPdf(base64: string): Promise<ParsedBill> {
  return callParse([{ inline_data: { mime_type: "application/pdf", data: base64 } }, { text: PROMPT }]);
}

// Excel/文本账单：解析出的表格文本喂给 AI（同 schema）。
export async function parseBillText(text: string): Promise<ParsedBill> {
  return callParse([{ text: `${PROMPT}\n\n账单内容（从 Excel 提取的表格文本）：\n${text}` }]);
}

async function callParse(parts: unknown[]): Promise<ParsedBill> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("缺少 GEMINI_API_KEY");
  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0 },
  });

  let lastErr = "";
  for (const model of MODELS) {
    // 同一模型对 503/429 再重试一次（短暂过载多为瞬时）
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Gemini 未返回内容");
        return JSON.parse(text) as ParsedBill;
      }
      lastErr = `${res.status} ${await res.text()}`;
      if (res.status === 503 || res.status === 429) { await new Promise((r) => setTimeout(r, 1500)); continue; }
      break; // 非过载错误：换下一个模型
    }
  }
  throw new Error(`Gemini 解析失败（已重试/降级）：${lastErr}`);
}
