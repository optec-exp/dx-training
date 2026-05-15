import Groq from "groq-sdk";
import { NextRequest } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text?.trim()) {
    return new Response("会议记录不能为空", { status: 400 });
  }

  try {
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "你是一位专业的会议纪要助手。请仔细阅读用户提供的会议记录，并按照指定格式输出结果，不要添加其他内容。",
        },
        {
          role: "user",
          content: `请分析以下会议记录，并按照格式输出：

【会议记录】
${text}

请按照以下格式输出：

【摘要】
（用3～5句话简洁概括会议的主要内容、决定事项和讨论结果）

【行动项目】
• 任务内容 | 负责人：xxx | 期限：xxx
• 任务内容 | 负责人：xxx | 期限：xxx

如果会议记录中没有明确负责人或期限，请写"未定"。`,
        },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content ?? "";
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("AI 生成失败，请稍后重试", { status: 500 });
  }
}
