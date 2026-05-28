import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';
import { aggregate } from '../lib/aggregate.js';
import { SYSTEM_PROMPT, buildStatsText } from '../lib/prompt.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const { data } = await supabase.from('ncr_records').select('*');
const stats = aggregate(data);
const statsText = buildStatsText(stats, data);

console.log('===== 喂给 AI 的统计文字 =====\n');
console.log(statsText);
console.log('\n===== AI 分析报告 =====\n');

const res = await groq.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  temperature: 0.4,
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: statsText },
  ],
});

console.log(res.choices[0].message.content);
