import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { title, content } = await req.json() as { title: string; content: string };

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `请为以下公司内部知识库文章生成摘要和标签。

标题：${title}
内容：${content}

请严格按以下JSON格式返回，不要包含其他任何内容：
{
  "summary": "一到两句话的中文摘要",
  "tags": ["标签1", "标签2", "标签3"]
}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    // 提取 JSON（防止 AI 返回多余文字）
    const match = text.match(/\{[\s\S]*\}/);
    const result = JSON.parse(match ? match[0] : "{}") as {
      summary?: string;
      tags?: string[];
    };

    return NextResponse.json({
      summary: result.summary ?? "",
      tags:    result.tags    ?? [],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ summary: "", tags: [] });
  }
}
