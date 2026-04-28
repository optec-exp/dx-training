import type { Lang, Category, Urgency } from './types'

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'EN' },
  { code: 'ja', label: '日本語' },
]

export const CATEGORY_LABELS: Record<Category, Record<Lang, string>> = {
  ar:         { zh: '应收账款',   en: 'Accounts Receivable', ja: '売掛金管理'   },
  ap:         { zh: '应付账款',   en: 'Accounts Payable',    ja: '買掛金管理'   },
  reconcile:  { zh: '账目对账',   en: 'Reconciliation',      ja: '勘定照合'     },
  report:     { zh: '报告编制',   en: 'Reporting',           ja: '報告書作成'   },
  approval:   { zh: '审核存档',   en: 'Approval & Filing',   ja: '承認・保管'   },
}

export const PRIORITY_LABELS = {
  zh: { high: '高', medium: '中', low: '低' },
  en: { high: 'High', medium: 'Med', low: 'Low' },
  ja: { high: '高', medium: '中', low: '低' },
}

export const URGENCY_LABELS: Record<Urgency, Record<Lang, string>> = {
  overdue: { zh: '已逾期', en: 'Overdue', ja: '期限超過' },
  today:   { zh: '今日截止', en: 'Due Today', ja: '本日期限' },
  soon:    { zh: '即将到期', en: 'Due Soon', ja: 'まもなく期限' },
  normal:  { zh: '', en: '', ja: '' },
  done:    { zh: '已完成', en: 'Done', ja: '完了' },
}

export const UI = {
  zh: {
    title: '月度结算检查清单',
    subtitle: '财务月结 · 进度追踪',
    deadlineLabel: (day: number) => `${day}日截止`,
    progress: (done: number, total: number) => `已完成 ${done} / ${total} 项`,
    progressRate: (pct: number) => `完成率 ${pct}%`,
    allDone: '🎉 本月结算全部完成！',
    filterAll: '全部',
    filterPending: '待处理',
    filterDone: '已完成',
    resetAll: '重置全部',
    resetConfirm: '确定要清除所有勾选状态吗？',
    checkedAt: (date: string) => `${date} 完成`,
    noItems: '没有符合条件的项目',
    month: (y: number, m: number) => `${y} 年 ${m} 月`,
    today: '今天',
  },
  en: {
    title: 'Monthly Settlement Checklist',
    subtitle: 'Month-End Close · Progress Tracker',
    deadlineLabel: (day: number) => `Due: ${day}${ordinal(day)}`,
    progress: (done: number, total: number) => `${done} of ${total} completed`,
    progressRate: (pct: number) => `${pct}% complete`,
    allDone: '🎉 All month-end tasks completed!',
    filterAll: 'All',
    filterPending: 'Pending',
    filterDone: 'Done',
    resetAll: 'Reset All',
    resetConfirm: 'Clear all checked items?',
    checkedAt: (date: string) => `Completed ${date}`,
    noItems: 'No matching items',
    month: (y: number, m: number) => `${monthNameEn(m)} ${y}`,
    today: 'Today',
  },
  ja: {
    title: '月次決算チェックリスト',
    subtitle: '月次締め · 進捗管理',
    deadlineLabel: (day: number) => `${day}日締め`,
    progress: (done: number, total: number) => `${done} / ${total} 完了`,
    progressRate: (pct: number) => `完了率 ${pct}%`,
    allDone: '🎉 今月の決算作業がすべて完了しました！',
    filterAll: 'すべて',
    filterPending: '未完了',
    filterDone: '完了済',
    resetAll: 'リセット',
    resetConfirm: 'すべてのチェックをリセットしますか？',
    checkedAt: (date: string) => `${date} 完了`,
    noItems: '該当する項目がありません',
    month: (y: number, m: number) => `${y}年${m}月`,
    today: '今日',
  },
} as const

function ordinal(d: number): string {
  if (d >= 11 && d <= 13) return 'th'
  if (d % 10 === 1) return 'st'
  if (d % 10 === 2) return 'nd'
  if (d % 10 === 3) return 'rd'
  return 'th'
}

function monthNameEn(m: number): string {
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] ?? ''
}
