import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { CONTAINMENT_PROMPT } from '@/lib/prompts'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request) {
  try {
    const { summary, problem_type, severity, customer, transport_mode, department } = await request.json()
    if (!summary) {
      return NextResponse.json({ error: '需要事件概要' }, { status: 400 })
    }

    const userContent = `事件概要:${summary}
问题类型:${problem_type || '(未分类)'}
严重度:${severity || '(未定级)'}
客户:${customer || '(无,可能为内部案件)'}
输送领域:${transport_mode || '(未填)'}
发生部门:${department || '(未填)'}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: CONTAINMENT_PROMPT },
        { role: 'user', content: userContent },
      ],
    })

    let parsed = { actions: [], spread_risk: '' }
    try {
      parsed = JSON.parse(completion.choices?.[0]?.message?.content || '{}')
    } catch {
      // ignore
    }

    return NextResponse.json({
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      spread_risk: parsed.spread_risk || '(AI 未给出扩散风险预判)',
    })
  } catch (err) {
    console.error('遏制建议接口出错:', err)
    return NextResponse.json({ error: err.message || '获取建议失败' }, { status: 500 })
  }
}
