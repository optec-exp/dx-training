import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';
import { aggregate } from '@/lib/aggregate';
import { SYSTEM_PROMPT, buildStatsText } from '@/lib/prompt';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST() {
  try {
    const { data: records, error } = await supabase
      .from('ncr_records')
      .select('*')
      .order('occur_date', { ascending: true });

    if (error) throw new Error('读取数据失败：' + error.message);
    if (!records || records.length === 0) {
      return Response.json({ error: '没有可分析的数据' }, { status: 400 });
    }

    const stats = aggregate(records);
    const statsText = buildStatsText(stats, records);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: statsText },
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
