import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/app/lib/knowledge";

const MODEL = "gemini-2.5-flash";
const MAX_MESSAGES = 20; // 上下文窗口：最多保留最近 20 条消息（约 10 轮问答）

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 GEMINI_API_KEY" }, { status: 500 });
  }

  const { messages } = (await req.json()) as { messages?: Msg[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages 不能为空" }, { status: 400 });
  }

  // 上下文窗口控制：只保留最近 MAX_MESSAGES 条
  const recent = messages.slice(-MAX_MESSAGES);
  // Gemini 要求历史从 user 开始，裁掉开头多余的 assistant，避免报错
  while (recent.length && recent[0].role === "assistant") recent.shift();
  console.log(`[chat] 收到 ${messages.length} 条，实际发送 ${recent.length} 条`);

  // 转成 Gemini 的 contents 格式：assistant → model
  const contents = recent.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[Gemini error]", res.status, detail);
    const error =
      res.status === 429
        ? "超出免费额度啦～（免费层每分钟、每天都有上限），请稍后或明天再试。"
        : "Gemini 调用失败，请稍后重试。";
    return NextResponse.json({ error }, { status: 502 });
  }

  const data = await res.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "(无回复)";

  return NextResponse.json({ reply });
}
