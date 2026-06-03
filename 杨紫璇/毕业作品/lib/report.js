// 不符合项报告共用辅助函数

export function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('zh-CN', { hour12: false })
}

export function fmtDateOnly(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('zh-CN')
}

export function fmtMoney(v) {
  if (v == null || v === '') return '—'
  return `¥${Number(v).toLocaleString()}`
}

// 阶段 SLA 时效:对比截止时间 vs 实际完成时间
export function slaCompliance(dueRaw, doneRaw) {
  if (!dueRaw) return { text: '—', overdue: false }
  if (!doneRaw) return { text: '未完成', overdue: false }
  const due = new Date(dueRaw).getTime()
  const done = new Date(doneRaw).getTime()
  const overdue = done > due
  const diffH = Math.abs(done - due) / 3600000
  const diffText = diffH < 48 ? `${diffH.toFixed(1)}h` : `${(diffH / 24).toFixed(1)}d`
  return { text: overdue ? `超期 ${diffText}` : `准时(提前 ${diffText})`, overdue }
}

// 提取 AI containment 留痕的动作清单
export function extractContainmentActions(record) {
  const arr = record.containment_ai?.actions
  return Array.isArray(arr) ? arr : []
}

// 提取 AI 5Why 链
export function extractFiveWhy(record) {
  const arr = record.capa_ai?.five_why_chain
  return Array.isArray(arr) ? arr.filter(Boolean) : []
}

// 从 root_cause 字段中只提取「【根本原因】xxx」的结论部分(去掉前面的 5Why 推演)
// 数据库里 root_cause 是 buildRootCauseText 拼出来的:5Why链 + '\n\n【根本原因】' + 结论
export function extractRootCauseConclusion(text) {
  if (!text) return ''
  const marker = '【根本原因】'
  const idx = text.indexOf(marker)
  if (idx >= 0) return text.slice(idx + marker.length).trim()
  return text.trim()
}

// 报告唯一编号:NCR-{年}-{6位ID尾}
export function reportNo(record) {
  const year = (record.occur_date || record.created_at || new Date().toISOString()).slice(0, 4)
  const idTail = String(record.id || '').slice(-6).toUpperCase()
  return `NCR-${year}-${idTail}`
}
