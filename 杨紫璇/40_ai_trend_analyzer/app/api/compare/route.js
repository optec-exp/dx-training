import Groq from 'groq-sdk';
import { COMPARE_SYSTEM_PROMPT, buildCompareText } from '@/lib/prompt';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  try {
    const { reportA, reportB } = await request.json();
    if (!reportA || !reportB) {
      return Response.json({ error: '需要两份报告' }, { status: 400 });
    }

    // 时间早的作为"上一期"
    const [older, newer] =
      new Date(reportA.created_at) <= new Date(reportB.created_at)
        ? [reportA, reportB]
        : [reportB, reportA];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      stream: true,
      messages: [
        { role: 'system', content: COMPARE_SYSTEM_PROMPT },
        { role: 'user', content: buildCompareText(older, newer) },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
