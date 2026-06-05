// Gemini 免费层：多模态读账单 PDF → responseSchema 结构化。
// 将来换 Claude API：只替换本文件。

const MODEL = "gemini-2.5-flash"; // 文档解析；免费层约 20/天

export interface ParsedBillLine {
  opt_no: string;
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
    供应商: { type: "string", description: "Courier Full Name / 收款人 / 供应商名" },
    币种: { type: "string", description: "Subtotal 标注的货币代码，如 HKD/USD/JPY" },
    类型: { type: "string", enum: ["单票", "SOA"] },
    账单日期: { type: "string" },
    lines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          opt_no: { type: "string", description: "Job No.，即 OPT 编号" },
          routing: { type: "string" },
          date: { type: "string" },
          金额: { type: "number", description: "该行 TOTAL 金额（原币种数值）" },
        },
        required: ["opt_no", "金额"],
      },
    },
  },
  required: ["供应商", "币种", "类型", "lines"],
};

const PROMPT = `这是一张国际货代的成本账单（供应商/快递员费用清单）。提取结构化数据：
- 供应商：Courier Full Name 或收款人名称
- 币种：Subtotal 处标注的货币代码
- 类型：只有 1 个 Job No. 为"单票"，多个为"SOA"
- lines：每行明细，opt_no 取 Job No.(OPT编号)，金额取该行 TOTAL（原币种数值，去掉货币符号和千分位逗号）
只返回 JSON。`;

export async function parseBillPdf(base64: string): Promise<ParsedBill> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("缺少 GEMINI_API_KEY");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: { mime_type: "application/pdf", data: base64 } }, { text: PROMPT }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini 解析失败: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini 未返回内容");
  return JSON.parse(text) as ParsedBill;
}
