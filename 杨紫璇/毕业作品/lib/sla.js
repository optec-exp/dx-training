// 部门 × 严重度 → 默认负责人(占位假名,后期按公司实际情况调整)
export const DEPT_OWNERS_BY_SEVERITY = {
  '空运操作部': { S4: '张部长', S3: '张经理', S2: '张主管', S1: '张主管' },
  '海运操作部': { S4: '李部长', S3: '李经理', S2: '李主管', S1: '李主管' },
  '客服部':     { S4: '王部长', S3: '王经理', S2: '王主管', S1: '王主管' },
  '报关部':     { S4: '赵部长', S3: '赵经理', S2: '赵主管', S1: '赵主管' },
  '仓储部':     { S4: '钱部长', S3: '钱经理', S2: '钱主管', S1: '钱主管' },
  '销售部':     { S4: '孙部长', S3: '孙经理', S2: '孙主管', S1: '孙主管' },
}

export function getOwner(department, severity) {
  if (!department || !severity) return null
  return DEPT_OWNERS_BY_SEVERITY[department]?.[severity] || null
}

// 6 层 SLA 的时长(小时)
// 严格递增:① 遏制 ≤ ② 原因 ≤ ③ 纠正制定 ≤ ④ 纠正完成;② 原因 ≤ ⑤ 预防制定 ≤ ⑥ 预防完成
const SLA_HOURS = {
  containment:     { S4: 4,        S3: 8,        S2: 24,       S1: 48       },
  root_cause:      { S4: 2 * 24,   S3: 3 * 24,   S2: 5 * 24,   S1: 7 * 24   },
  corrective_plan: { S4: 3 * 24,   S3: 5 * 24,   S2: 7 * 24,   S1: 10 * 24  },
  corrective_done: { S4: 10 * 24,  S3: 21 * 24,  S2: 30 * 24,  S1: 45 * 24  },
  preventive_plan: { S4: 5 * 24,   S3: 10 * 24,  S2: 14 * 24,  S1: 21 * 24  },
  preventive_done: { S4: 30 * 24,  S3: 60 * 24,  S2: 90 * 24,  S1: 120 * 24 },
}

// 各阶段的中文标签(用于 UI)
export const SLA_LABELS = {
  containment:     '① 首次遏制',
  root_cause:      '② 原因分析填写',
  corrective_plan: '③ 纠正措施制定',
  corrective_done: '④ 纠正措施完成',
  preventive_plan: '⑤ 预防措施制定',
  preventive_done: '⑥ 预防措施完成',
}

export const SLA_KINDS = Object.keys(SLA_LABELS)

function calcDue(kind, severity, occurDate) {
  if (!severity || !occurDate) return null
  const hours = SLA_HOURS[kind]?.[severity]
  if (!hours) return null
  const base = new Date(occurDate)
  if (isNaN(base.getTime())) return null
  return new Date(base.getTime() + hours * 3600 * 1000).toISOString()
}

// 一次性算 6 个 SLA,返回数据库列名→ISO 字符串 的对象,可直接 spread 进 insert payload
export function calcAllDues(severity, occurDate) {
  return {
    sla_containment_due:      calcDue('containment',     severity, occurDate),
    sla_root_cause_due:       calcDue('root_cause',      severity, occurDate),
    sla_corrective_plan_due:  calcDue('corrective_plan', severity, occurDate),
    sla_corrective_done_due:  calcDue('corrective_done', severity, occurDate),
    sla_preventive_plan_due:  calcDue('preventive_plan', severity, occurDate),
    sla_preventive_done_due:  calcDue('preventive_done', severity, occurDate),
  }
}

// 修改 severity 时:重算所有「未完成」阶段的 SLA(基准仍是 occur_date)。已完成的阶段不动(历史事实)。
export function recomputeAllDues(record, newSeverity) {
  const all = calcAllDues(newSeverity, record.occur_date)
  const updates = {}
  if (!record.containment_at)     updates.sla_containment_due     = all.sla_containment_due
  if (!record.root_cause_at)      updates.sla_root_cause_due      = all.sla_root_cause_due
  if (!record.corrective_plan_at) updates.sla_corrective_plan_due = all.sla_corrective_plan_due
  if (!record.corrective_done_at) updates.sla_corrective_done_due = all.sla_corrective_done_due
  if (!record.preventive_plan_at) updates.sla_preventive_plan_due = all.sla_preventive_plan_due
  if (!record.preventive_done_at) updates.sla_preventive_done_due = all.sla_preventive_done_due
  return updates
}

// 格式化截止时间为「YYYY-MM-DD HH:mm」
export function formatDue(dueIso) {
  if (!dueIso) return { text: '—', overdue: false }
  const d = new Date(dueIso)
  const text = d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return { text, overdue: d.getTime() < Date.now() }
}

export function isOverdue(dueIso) {
  if (!dueIso) return false
  return new Date(dueIso).getTime() < Date.now()
}

// 给一个 NCR 记录 + 阶段类型,返回这个阶段的状态:
//   { state: 'pending' | 'done', dueText, doneText, badge, color }
// pending: 进行中(可能已超期);done: 已完成(可能按时/超期完成)
export function getStageStatus(record, kind) {
  const doneAt = record[STAGE_FIELD_AT[kind]]
  const dueIso = record[STAGE_FIELD_DUE[kind]]
  const { text: dueText, overdue } = formatDue(dueIso)
  if (doneAt) {
    const doneDate = new Date(doneAt)
    const doneText = doneDate.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    })
    const lateCompletion = dueIso && doneDate.getTime() > new Date(dueIso).getTime()
    return {
      state: 'done',
      dueText,
      doneText,
      badge: lateCompletion ? '✓ 已完成(超期)' : '✓ 按时完成',
      color: lateCompletion ? 'text-orange-600' : 'text-emerald-600',
    }
  }
  return {
    state: 'pending',
    dueText,
    doneText: null,
    badge: overdue ? '⚠ 进行中 · 已超期' : '⏳ 进行中',
    color: overdue ? 'text-red-600' : 'text-slate-500',
  }
}

// 判断一条 NCR 目前卡在哪个阶段(待办页用)
export function getCurrentStage(record) {
  if (!record.containment_at)    return 'containment'
  if (!record.root_cause_at)     return 'root_cause'
  if (!record.corrective_plan_at) return 'corrective_plan'
  if (!record.corrective_done_at) return 'corrective_done'
  if (!record.preventive_plan_at) return 'preventive_plan'
  if (!record.preventive_done_at) return 'preventive_done'
  return null // 全部完成
}

const STAGE_FIELD_DUE = {
  containment:     'sla_containment_due',
  root_cause:      'sla_root_cause_due',
  corrective_plan: 'sla_corrective_plan_due',
  corrective_done: 'sla_corrective_done_due',
  preventive_plan: 'sla_preventive_plan_due',
  preventive_done: 'sla_preventive_done_due',
}

const STAGE_FIELD_AT = {
  containment:     'containment_at',
  root_cause:      'root_cause_at',
  corrective_plan: 'corrective_plan_at',
  corrective_done: 'corrective_done_at',
  preventive_plan: 'preventive_plan_at',
  preventive_done: 'preventive_done_at',
}
