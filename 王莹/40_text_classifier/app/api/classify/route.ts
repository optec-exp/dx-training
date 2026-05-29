import { NextResponse } from "next/server";

// 可分类别（与前端保持一致）
const CATEGORIES = ["投诉", "咨询", "表扬", "建议", "其他"];

const MODEL = "gemini-2.5-flash";
const MAX_ATTEMPTS = 3; // 临时故障时最多尝试 3 次
const TIMEOUT_MS = 20000; // 单次请求超时

// 告诉 Gemini 必须按这个 JSON 结构返回，category 只能是给定的几个值之一
const responseSchema = {
  type: "object",
  properties: {
    category: { type: "string", enum: CATEGORIES },
    confidence: { type: "number" },
    reason: { type: "string" },
  },
  required: ["category", "confidence", "reason"],
};

const SYSTEM_INSTRUCTION = `你是一个文本分类助手。请把用户提供的文本归类到以下类别之一：${CATEGORIES.join(
  "、"
)}。

规则：
1. 只能从上面给定的类别中选择一个，不能创造新类别。
2. confidence 表示你对这个判断的把握程度，取值是 0 到 1 之间的小数（例如 0.85）。
3. reason 用一到两句中文说明判断依据。`;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function callGemini(apiKey: string, text: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ parts: [{ text: `请对以下文本分类：\n\n${text}` }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      },
    }),
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "服务器未配置 GEMINI_API_KEY" },
      { status: 500 }
    );
  }

  // 解析请求体，防止非法 JSON 让服务崩溃
  let text: unknown;
  try {
    ({ text } = await request.json());
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "请提供要分类的文本" }, { status: 400 });
  }

  // 调用 Gemini：对临时故障（503 过载 / 500 / 网络超时）自动重试
  let geminiRes: Response | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      geminiRes = await callGemini(apiKey, text);
    } catch {
      // 网络错误或超时
      if (attempt < MAX_ATTEMPTS) {
        await delay(attempt * 800);
        continue;
      }
      return NextResponse.json(
        { error: "无法连接 Gemini，请检查网络后重试" },
        { status: 502 }
      );
    }

    if (
      (geminiRes.status === 503 || geminiRes.status === 500) &&
      attempt < MAX_ATTEMPTS
    ) {
      await delay(attempt * 800); // 退避后重试
      continue;
    }
    break;
  }

  if (!geminiRes) {
    return NextResponse.json(
      { error: "分类服务暂时不可用，请稍后重试" },
      { status: 502 }
    );
  }

  if (!geminiRes.ok) {
    if (geminiRes.status === 429) {
      return NextResponse.json(
        { error: "今天的免费配额已用完，请明天再试或更换模型" },
        { status: 429 }
      );
    }
    if (geminiRes.status === 503) {
      return NextResponse.json(
        { error: "模型当前繁忙，多次重试仍失败，请稍后再试" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "调用 Gemini 失败，请稍后重试" },
      { status: 502 }
    );
  }

  const data = await geminiRes.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    return NextResponse.json(
      { error: "Gemini 未返回有效内容，请重试" },
      { status: 502 }
    );
  }

  // 安全解析模型输出：即便配了 responseSchema，也兜底防止异常 JSON 让服务崩
  let result: { category?: unknown; confidence?: unknown; reason?: unknown };
  try {
    result = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "解析分类结果失败，请重试" },
      { status: 502 }
    );
  }

  if (
    typeof result.category !== "string" ||
    typeof result.confidence !== "number" ||
    typeof result.reason !== "string"
  ) {
    return NextResponse.json(
      { error: "分类结果格式异常，请重试" },
      { status: 502 }
    );
  }

  return NextResponse.json(result);
}
