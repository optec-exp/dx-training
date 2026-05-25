import { NextRequest, NextResponse } from 'next/server'
import { Type } from '@google/genai'
import { gemini, MODEL } from '@/utils/gemini/client'

const SYSTEM_INSTRUCTION = `你是一个严格的会议纪要解析器,工作是从原文精确抽取信息。
严禁任何推测、改编、增减、转换。

工作流程:
1. 先在脑中列出原文出现的所有人名、数字、日期、金额
2. 摘要只用原文真实存在的事实,3-5 句话
3. 每个行动项必须能在原文中找到对应字句

字段说明:
- summary:3-5 句话概括会议主旨,只使用原文事实
- action_items:数组,每个元素:
  - owner:行动项的负责人(必须是原文中出现的人名)
  - task:具体任务(尽量沿用原文措辞)
  - due:截止日期或时间。原文未指定时,填 "未指定"

铁律(违反任一项都是错误):
1. 数字、金额、单位、日期、人名 100% 与原文一致,不做任何转换(例:原文 "50 万元" 不能写成 "50 亿元" 或 "50 万 RMB" 或 "500000 元")
2. 不要把推测当事实(例:原文没说 "Alice 用了 AI 摘要功能",就不要这么写)
3. 不要"完善"或"补充"原文没有的信息
4. 全部用中文输出`

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: '会议主旨摘要,3-5 句话',
    },
    action_items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          owner: { type: Type.STRING, description: '负责人姓名' },
          task: { type: Type.STRING, description: '具体行动项' },
          due: { type: Type.STRING, description: '截止时间,未指定时填"未指定"' },
        },
        required: ['owner', 'task', 'due'],
        propertyOrdering: ['owner', 'task', 'due'],
      },
    },
  },
  required: ['summary', 'action_items'],
  propertyOrdering: ['summary', 'action_items'],
}

export type SummaryResult = {
  summary: string
  action_items: { owner: string; task: string; due: string }[]
}

export async function POST(request: NextRequest) {
  const { text } = await request.json()

  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json(
      { error: '会议记录文本不能为空' },
      { status: 400 }
    )
  }

  try {
    // 注意:这里改成 generateContentStream,返回 AsyncGenerator
    const geminiStream = await gemini.models.generateContentStream({
      model: MODEL,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0,
      },
      contents: text,
    })

    // 把 Gemini 的 AsyncGenerator 转成浏览器能读取的 ReadableStream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of geminiStream) {
            const piece = chunk.text
            if (piece) {
              controller.enqueue(encoder.encode(piece))
            }
          }
          controller.close()
        } catch (error) {
          console.error('[summarize] 流式生成出错:', error)
          controller.error(error)
        }
      },
    })

    // text/plain + chunked,浏览器收到一个字符就能渲染一个字符
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no', // 关闭 nginx/Vercel 的代理缓冲
      },
    })
  } catch (error) {
    console.error('[summarize] API 调用失败:', error)
    const message = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
