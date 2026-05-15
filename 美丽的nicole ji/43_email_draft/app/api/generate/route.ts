import Groq from "groq-sdk";
import { NextRequest } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { points, tone, recipient } = await req.json();

  if (!points?.trim()) {
    return new Response("请输入邮件要点", { status: 400 });
  }

  const toneLabel = tone === "formal" ? "正式" : "礼貌友善";

  // Few-shot 提示：提供例文让 AI 理解格式要求
  const prompt = `你是一位精通日语、英语、中文的商务邮件专家。
请根据用户提供的邮件要点，生成三种语言的商务邮件草稿。

【格式要求】
- 语气：${toneLabel}的商务邮件
- 收件人类型：${recipient || "客户/合作方"}
- 必须严格按照以下格式输出，不要添加任何其他内容

【输出格式示例】
===日本語===
件名：○○について

△△株式会社
□□様

お世話になっております。
...

===ENGLISH===
Subject: Regarding ○○

Dear Mr./Ms. □□,

I hope this email finds you well.
...

===中文===
主题：关于○○

尊敬的□□先生/女士，

您好！
...

【用户的邮件要点】
${points}

现在请生成三语版本：`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "你是一位精通日语、英语、中文三语的商务邮件专家，能写出符合各语言商务礼仪的专业邮件。请严格按照用户指定的格式输出。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
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
    return new Response("生成失败，请稍后重试", { status: 500 });
  }
}
