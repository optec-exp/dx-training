import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { CAPA_PROMPT } from '@/lib/prompts'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request) {
  try {
    const { summary, problem_type, severity, customer, transport_mode, department, containment } =
      await request.json()
    if (!summary) {
      return NextResponse.json({ error: '需要事件概要' }, { status: 400 })
    }

    const userContent = `事件概要:${summary}
问题类型:${problem_type || '(未分类)'}
严重度:${severity || '(未定级)'}
客户:${customer || '(无,可能为内部案件)'}
输送领域:${transport_mode || '(未填)'}
发生部门:${department || '(未填)'}
已执行的遏制动作:
${containment || '(暂未执行遏制)'}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: CAPA_PROMPT },
        { role: 'user', content: userContent },
      ],
    })

    let parsed = {}
    try {
      parsed = JSON.parse(completion.choices?.[0]?.message?.content || '{}')
    } catch {
      // ignore
    }

    return NextResponse.json({
      five_why_chain: Array.isArray(parsed.five_why_chain) ? parsed.five_why_chain : [],
      root_cause: parsed.root_cause || '',
      corrective_action: parsed.corrective_action || '',
      preventive_action: parsed.preventive_action || '',
      needs_sop_revision: !!parsed.needs_sop_revision,
      sop_note: parsed.sop_note || '',
    })
  } catch (err) {
    console.error('CAPA 建议接口出错:', err)
    return NextResponse.json({ error: err.message || '获取建议失败' }, { status: 500 })
  }
}
