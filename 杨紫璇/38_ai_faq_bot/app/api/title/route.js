import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const TITLE_SYSTEM_PROMPT = `你是一个对话主题概括助手。请用 5 到 10 个中文字概括下面这段对话的主题，作为会话标题。

规则：
- 只输出标题文本，不要任何引号、标点、解释或前缀
- 长度严格控制在 5~10 个中文字以内
- 简洁、准确、可读
- 不要使用"关于"、"咨询"等冗余词，直接说主题`

export async function POST(request) {
  try {
    const { userMessage, aiReply } = await request.json()

    const dialogText = `用户：${userMessage}\nAI：${aiReply}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: TITLE_SYSTEM_PROMPT },
        { role: 'user', content: dialogText },
      ],
    })

    let title = completion.choices[0].message.content.trim()
    title = title.replace(/^["'《「]+|["'》」]+$/g, '').trim()
    if (title.length > 20) title = title.slice(0, 20)

    return Response.json({ title })
  } catch (error) {
    console.error('Title API error:', error)
    return Response.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}
