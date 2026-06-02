import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { CLASSIFY_PROMPT } from '@/lib/prompts'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// 硬规则:命中即强制 S4(法律/安全红线,AI 不能覆盖)
function ruleSeverity(summary) {
  const s = summary || ''
  if (/危险品|瞒报|MSDS|违法/.test(s)) {
    return { severity: 'S4', reason: '硬规则:涉及危险品申报错误或违法风险' }
  }
  if (/泄露|外发对象/.test(s)) {
    return { severity: 'S4', reason: '硬规则:重大信息泄露' }
  }
  if (/停产|停运|暂停合作|业务中断/.test(s)) {
    return { severity: 'S4', reason: '硬规则:客户中断/停运' }
  }
  return null
}

export async function POST(request) {
  try {
    const { summary, category, customer, transport_mode, department } = await request.json()
    if (!summary) {
      return NextResponse.json({ error: '需要事件概要' }, { status: 400 })
    }

    const rule = ruleSeverity(summary)

    const userContent = `事件概要:${summary}
分类:${category || '(未填)'}
客户:${customer || '(无,可能为内部案件)'}
输送领域:${transport_mode || '(未填)'}
发生部门:${department || '(未填)'}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: CLASSIFY_PROMPT },
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
      problem_type: parsed.problem_type || '其他',
      severity: rule?.severity || parsed.severity || 'S2',
      reason: rule
        ? `[规则强制 ${rule.severity}] ${rule.reason}${parsed.reason ? ` / [AI 补充] ${parsed.reason}` : ''}`
        : parsed.reason || '(AI 未给出理由)',
      source: rule ? 'rule+ai' : 'ai',
    })
  } catch (err) {
    console.error('分类接口出错:', err)
    return NextResponse.json({ error: err.message || '分类失败' }, { status: 500 })
  }
}
