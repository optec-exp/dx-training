import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  SYSTEM_INSTRUCTION,
  RESPONSE_SCHEMA,
  buildContents,
  sanitizeEmail,
  type EmailInput,
} from "./prompt";

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "服务端未配置 GEMINI_API_KEY，请在 .env.local 中填写。" },
      { status: 500 }
    );
  }

  let input: EmailInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON。" }, { status: 400 });
  }

  if (!input.points?.trim()) {
    return NextResponse.json({ error: "邮件要点不能为空。" }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: buildContents(input),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "AI 未返回内容，请稍后重试。" },
        { status: 502 }
      );
    }

    const data = JSON.parse(text);
    const cleaned = {
      japanese: sanitizeEmail(data.japanese, input.relation, "ja"),
      english: sanitizeEmail(data.english, input.relation, "en"),
      chinese: sanitizeEmail(data.chinese, input.relation, "zh"),
    };
    return NextResponse.json(cleaned);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[generate] 调用 Gemini 失败:", message);

    // 配额 / 频率限制（429）：给出人话提示，而非原始英文 JSON。
    if (
      message.includes("429") ||
      message.includes("RESOURCE_EXHAUSTED") ||
      message.toLowerCase().includes("quota")
    ) {
      const retryMatch =
        message.match(/retry in ([\d.]+)s/i) ||
        message.match(/"retryDelay":\s*"(\d+)s"/);
      const seconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : null;
      const hint = seconds
        ? `请约 ${seconds} 秒后重试。`
        : "请稍后重试，若持续失败可能是今日免费额度已用完。";
      return NextResponse.json(
        { error: `调用太频繁或免费额度暂时用尽。${hint}` },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "生成失败：" + message },
      { status: 500 }
    );
  }
}
