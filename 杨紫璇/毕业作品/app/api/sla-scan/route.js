import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentStage, SLA_LABELS } from '@/lib/sla'

const STAGE_DUE_FIELD = {
  containment:     'sla_containment_due',
  root_cause:      'sla_root_cause_due',
  corrective_plan: 'sla_corrective_plan_due',
  corrective_done: 'sla_corrective_done_due',
  preventive_plan: 'sla_preventive_plan_due',
  preventive_done: 'sla_preventive_done_due',
}

const STAGE_OWNER_FIELD = {
  containment:     'containment_owner',
  root_cause:      'root_cause_owner',
  corrective_plan: 'corrective_owner',
  corrective_done: 'corrective_owner',
  preventive_plan: 'preventive_owner',
  preventive_done: 'preventive_owner',
}

function formatDuration(diffMs) {
  const abs = Math.abs(diffMs)
  if (abs < 3600000) return `${Math.round(abs / 60000)} 分钟`
  if (abs < 48 * 3600000) return `${(abs / 3600000).toFixed(1)} 小时`
  return `${(abs / (24 * 3600000)).toFixed(1)} 天`
}

function buildSlackMessage(overdueList, dueSoonList, origin) {
  const stamp = new Date().toLocaleString('zh-CN', { hour12: false })

  if (overdueList.length === 0 && dueSoonList.length === 0) {
    return { text: `✅ SLA 巡检 · ${stamp} · 无超期/即将到期` }
  }

  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: '⏰ SLA 巡检结果' } },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: `🔴 已超期 *${overdueList.length}* 条 · 🟡 24h 内即将到期 *${dueSoonList.length}* 条 · 巡检时间 ${stamp}`,
      }],
    },
  ]

  function renderItem(item, prefix) {
    const linkText = origin ? `<${origin}/ncr/${item.id}|${item.summary}>` : item.summary
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `• ${linkText}\n   ${item.severity || '—'} · ${item.department || '—'} · 阶段:${item.stageLabel} · 负责人:${item.owner || '—'} · ${prefix} *${item.relativeText}*`,
      },
    }
  }

  if (overdueList.length > 0) {
    blocks.push({ type: 'divider' })
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: '*🔴 已超期*' } })
    for (const item of overdueList) blocks.push(renderItem(item, '超期'))
  }

  if (dueSoonList.length > 0) {
    blocks.push({ type: 'divider' })
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: '*🟡 24h 内即将到期*' } })
    for (const item of dueSoonList) blocks.push(renderItem(item, '剩'))
  }

  return {
    text: `⏰ SLA 巡检:${overdueList.length} 条已超期 · ${dueSoonList.length} 条 24h 内到期`,
    blocks,
  }
}

async function runScan(request) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ ok: false, error: 'SLACK_WEBHOOK_URL 未配置' }, { status: 500 })
  }

  const { data: records, error } = await supabase
    .from('ncr_records')
    .select('*')
    .eq('status', 'open')
    .is('deleted_at', null)
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  const now = Date.now()
  const ONE_DAY = 24 * 3600 * 1000
  const overdueList = []
  const dueSoonList = []

  for (const r of records || []) {
    const stage = getCurrentStage(r)
    if (!stage) continue
    const dueRaw = r[STAGE_DUE_FIELD[stage]]
    if (!dueRaw) continue
    const dueMs = new Date(dueRaw).getTime()
    const diff = dueMs - now
    const item = {
      id: r.id,
      severity: r.severity,
      department: r.department,
      summary: r.summary,
      stageLabel: SLA_LABELS[stage] || stage,
      owner: r[STAGE_OWNER_FIELD[stage]],
      dueAt: dueRaw,
      relativeText: formatDuration(diff),
    }
    if (diff < 0) overdueList.push(item)
    else if (diff <= ONE_DAY) dueSoonList.push(item)
  }

  overdueList.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
  dueSoonList.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))

  const host = request.headers.get('host') || ''
  const proto = request.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  const origin = host ? `${proto}://${host}` : ''

  const message = buildSlackMessage(overdueList, dueSoonList, origin)
  const slackRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  })

  if (!slackRes.ok) {
    const text = await slackRes.text()
    return NextResponse.json({ ok: false, error: `Slack 返回 ${slackRes.status}: ${text}` }, { status: 502 })
  }

  return NextResponse.json({
    ok: true,
    scanned: records?.length || 0,
    overdue: overdueList.length,
    due_soon: dueSoonList.length,
  })
}

export async function POST(request) { return runScan(request) }
export async function GET(request)  { return runScan(request) }
