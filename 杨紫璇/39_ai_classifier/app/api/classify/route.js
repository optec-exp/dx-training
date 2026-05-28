import Groq from 'groq-sdk'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const CATEGORIES = ['客诉投诉', '货态查询', '报价咨询', '业务咨询', '表扬感谢', '其他']

const SYSTEM_PROMPT = `你是一个专业的文本分类助手，负责把物流公司收到的客户文本（如客户反馈、邮件主题）归类。

请从以下类别中选择最合适的一个：
- 客诉投诉：对服务、货物破损、延误等表达不满或要求赔偿
- 货态查询：询问货物当前位置、到货时间、运单状态
- 报价咨询：询问价格、费用、运费、报价
- 业务咨询：询问服务内容、流程、单证、操作方法等一般性问题
- 表扬感谢：对服务表示满意、感谢、好评
- 其他：无法归入以上类别的内容

判断标准：根据文本的核心意图，只选一个最贴切的类别。

输出要求：必须严格输出如下 JSON，不要输出任何多余文字、解释或代码块标记：
{"category": "类别名称", "confidence": 0.0到1.0之间的小数, "reasoning": "一句话说明判断理由"}

要求：
- category 只能是上面列表里的类别之一
- confidence 是你对判断的把握程度，0 到 1 之间的小数（如 0.92）
- reasoning 用一句中文简要说明判断理由`

export async function POST(request) {
  try {
    const { text } = await request.json()

    if (!text || !text.trim()) {
      return NextResponse.json({ error: '请输入要分类的文本' }, { status: 400 })
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
    })

    const raw = completion.choices[0].message.content
    const result = JSON.parse(raw)

    if (!CATEGORIES.includes(result.category)) {
      result.category = '其他'
    }
    let confidence = Number(result.confidence)
    if (Number.isNaN(confidence)) confidence = 0
    result.confidence = Math.min(1, Math.max(0, confidence))

    const { error: dbError } = await supabase.from('classifications').insert({
      input_text: text,
      category: result.category,
      confidence: result.confidence,
      reasoning: result.reasoning,
    })

    return NextResponse.json({ ...result, saved: !dbError })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
