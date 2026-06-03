import { NextResponse } from 'next/server'

function buildMessage(event, payload, origin) {
  const detailUrl = payload.id && origin ? `${origin}/ncr/${payload.id}` : null

  if (event === 'ncr_created_s4') {
    const linkLine = detailUrl ? `\n\n<${detailUrl}|🔗 在系统中查看详情>` : ''
    return {
      text: `🚨 新建 S4 NCR · ${payload.summary || ''}`,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: '🚨 新建 S4 NCR(需通知社长)' } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*发生时间*\n${payload.occur_at_text || '—'}` },
            { type: 'mrkdwn', text: `*部门*\n${payload.department || '—'}` },
            { type: 'mrkdwn', text: `*客户*\n${payload.customer || '—'}` },
            { type: 'mrkdwn', text: `*问题类型*\n${payload.problem_type || '—'}` },
          ],
        },
        { type: 'section', text: { type: 'mrkdwn', text: `*事件概要*\n${payload.summary || ''}${linkLine}` } },
      ],
    }
  }

  if (event === 'ncr_closed') {
    const linkLine = detailUrl ? `\n\n<${detailUrl}|🔗 在系统中查看详情>` : ''
    return {
      text: `✅ NCR 已结案 · ${payload.summary || ''}`,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: '✅ NCR 已结案' } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*结案时间*\n${payload.closed_at_text || '—'}` },
            { type: 'mrkdwn', text: `*严重度*\n${payload.severity || '—'}` },
            { type: 'mrkdwn', text: `*部门*\n${payload.department || '—'}` },
            { type: 'mrkdwn', text: `*根本原因类别*\n${payload.root_cause_category || '—'}` },
          ],
        },
        { type: 'section', text: { type: 'mrkdwn', text: `*事件概要*\n${payload.summary || ''}${linkLine}` } },
      ],
    }
  }

  if (event === 'test') {
    return { text: `🧪 OPTEC QMS · 通道连通测试 · ${new Date().toLocaleString('zh-CN')}` }
  }

  return { text: `[${event}] ${JSON.stringify(payload)}` }
}

export async function POST(request) {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) {
    return NextResponse.json({ ok: false, error: 'SLACK_WEBHOOK_URL 未配置' }, { status: 500 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: '请求体不是有效 JSON' }, { status: 400 })
  }

  const { event, payload = {} } = body
  if (!event) {
    return NextResponse.json({ ok: false, error: '缺少 event 字段' }, { status: 400 })
  }

  const host = request.headers.get('host') || ''
  const proto = request.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  const origin = host ? `${proto}://${host}` : ''

  const message = buildMessage(event, payload, origin)

  const slackRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  })

  if (!slackRes.ok) {
    const text = await slackRes.text()
    return NextResponse.json({ ok: false, error: `Slack 返回 ${slackRes.status}: ${text}` }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
