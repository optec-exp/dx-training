import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { COMPARE_PROMPT } from '@/lib/prompts'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request) {
  try {
    const { reports } = await request.json()

    if (!Array.isArray(reports) || reports.length < 2) {
      return NextResponse.json({ error: '至少需要两份报告' }, { status: 400 })
    }

    const userContent = reports
      .map(
        (r, i) =>
          `【第 ${i + 1} 期:${r.title}】
统计数据:
${r.statsText || '(无快照)'}

分析结论:
${r.analysis_result || '(无)'}`
      )
      .join('\n\n========================================\n\n')

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      messages: [
        { role: 'system', content: COMPARE_PROMPT },
        { role: 'user', content: userContent },
      ],
    })

    const result = completion.choices?.[0]?.message?.content ?? ''
    return NextResponse.json({ result })
  } catch (err) {
    console.error('对比接口出错:', err)
    return NextResponse.json({ error: err.message || '对比失败' }, { status: 500 })
  }
}
