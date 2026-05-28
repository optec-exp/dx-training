import { NextRequest } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "@/lib/supabase";

const MODEL = "gemini-2.5-flash";

// 阶段1：只生成摘要纯文本（用于流式）
const SUMMARY_SYSTEM_PROMPT = `你是一名专业的会议纪要分析助手。
请阅读用户提供的会议记录原文，输出一段简洁、连贯的会议摘要，概括会议的核心议题、关键决定和结论。
规则：
- 只输出摘要正文，不要输出标题，不要列行动项清单，不要使用任何 Markdown 符号。
- 人名、职位、日期、时间必须逐字照搬原文，严禁改写、替换或意译。
- 只根据原文实际内容概括，绝对不要编造原文没有的信息。
- 用与会议记录相同的语言输出（中文记录用中文，日文用日文，英文用英文）。`;

// 阶段2：只提取行动项（用 responseSchema 保证 JSON 合法）
const ACTION_ITEMS_SYSTEM_PROMPT = `你是一名专业的会议纪要分析助手。
请从用户提供的会议记录原文中，提取明确提出的待办/行动项列表。每一项包含：
- task：要做的事（必填）
- owner：负责人（原文没提到就留空字符串）
- due：截止时间（原文没提到就留空字符串）
规则：
- 只提取原文中明确出现的行动项，绝对不要编造。
- 人名、日期、时间必须逐字照搬原文，严禁改写、替换或意译。
- owner 或 due 在原文中没有明确指定就留空字符串，不要猜测或补全。
- 如果没有任何行动项，返回空数组。
- 用与会议记录相同的语言。`;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  const { rawText } = await req.json();

  if (!rawText || typeof rawText !== "string" || rawText.trim() === "") {
    return new Response(JSON.stringify({ error: "会议记录不能为空" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // 发送一行 NDJSON（每行一个独立 JSON 对象）
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      try {
        // ===== 阶段1：流式生成摘要 =====
        let summary = "";
        const summaryStream = await ai.models.generateContentStream({
          model: MODEL,
          contents: rawText,
          config: {
            systemInstruction: SUMMARY_SYSTEM_PROMPT,
            temperature: 0,
          },
        });
        for await (const chunk of summaryStream) {
          const delta = chunk.text;
          if (delta) {
            summary += delta;
            send({ type: "summary_delta", text: delta });
          }
        }

        // ===== 阶段2：非流式提取行动项（responseSchema 保证 JSON 合法）=====
        const aiResp = await ai.models.generateContent({
          model: MODEL,
          contents: rawText,
          config: {
            systemInstruction: ACTION_ITEMS_SYSTEM_PROMPT,
            temperature: 0,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                action_items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      task: { type: Type.STRING },
                      owner: { type: Type.STRING },
                      due: { type: Type.STRING },
                    },
                    required: ["task", "owner", "due"],
                  },
                },
              },
              required: ["action_items"],
            },
          },
        });

        const text = aiResp.text;
        const parsed = text
          ? (JSON.parse(text) as {
              action_items: { task: string; owner: string; due: string }[];
            })
          : { action_items: [] };
        const actionItems = parsed.action_items ?? [];

        // ===== 阶段3：存入 Supabase =====
        const { data, error } = await supabase
          .from("meeting_minutes")
          .insert({
            raw_text: rawText,
            summary,
            action_items: actionItems,
            model: MODEL,
          })
          .select()
          .single();

        if (error) {
          send({ type: "error", message: "保存到数据库失败：" + error.message });
        } else {
          // ===== 阶段4：发送完成信号（带行动项 + 数据库 id）=====
          send({ type: "done", action_items: actionItems, id: data.id });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        send({ type: "error", message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
