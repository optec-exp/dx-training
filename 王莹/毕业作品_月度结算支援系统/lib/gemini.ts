// Gemini 免费层客户端（多模态解析账单 PDF/Excel → 结构化）。
// 将来换 Claude API：只需替换本文件实现，调用方不变。
// 沿用既有作品经验：用 responseSchema 强制结构化输出；解析准确率低的走人工复核。

const MODEL = "gemini-2.0-flash"; // 占位；按免费层额度在 flash-lite / 2.5-flash 间选

export interface BillLineParsed {
  opt_no: string | null;
  提单号: string | null;
  供应商: string | null;
  费用科目: string | null;
  原币种: string | null;
  金额_原币: number | null;
  ai置信度: number | null;
}

// TODO: 接入实际 Gemini API（@google/generative-ai 或 REST）。
// 现为 stub，便于先把对账/入库链路搭通；填 GEMINI_API_KEY 后实现。
export async function parseBillDocument(_fileUrl: string): Promise<BillLineParsed[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("缺少 GEMINI_API_KEY");
  void MODEL;
  throw new Error("parseBillDocument 尚未实现（骨架阶段）");
}
