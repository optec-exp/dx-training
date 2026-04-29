export type PaymentStatus = 'overdue' | 'urgent' | 'warning' | 'normal' | 'paid'

export interface Payment {
  id: string
  title: string
  amount: number
  currency: string
  dueDate: string
  category: string
  counterparty: string
}

export interface PaymentWithStatus extends Payment {
  status: PaymentStatus
  daysUntilDue: number
  adjustedDate: string
  isWeekendAdjusted: boolean
}

/** 若到期日是周末，顺延至下一个周一 */
export function getAdjustedDate(dueDate: string): { adjustedDate: string; isWeekendAdjusted: boolean } {
  const d = new Date(dueDate)
  const day = d.getDay()
  if (day === 6) {
    d.setDate(d.getDate() + 2) // 周六 → 周一
  } else if (day === 0) {
    d.setDate(d.getDate() + 1) // 周日 → 周一
  }
  const adjusted = d.toISOString().slice(0, 10)
  return { adjustedDate: adjusted, isWeekendAdjusted: adjusted !== dueDate }
}

/** 基于调整后的付款日计算状态 */
export function getPaymentStatus(dueDate: string, paidIds: Set<string>, id: string): PaymentStatus {
  if (paidIds.has(id)) return 'paid'
  const { adjustedDate } = getAdjustedDate(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(adjustedDate)
  due.setHours(0, 0, 0, 0)
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'overdue'
  if (diff <= 3) return 'urgent'
  if (diff <= 14) return 'warning'
  return 'normal'
}

export function getDaysUntilDue(dueDate: string): number {
  const { adjustedDate } = getAdjustedDate(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(adjustedDate)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// 低饱和度柔和配色，三档预警
export const STATUS_STYLES: Record<PaymentStatus, {
  bg: string; text: string; border: string
  badge: string; badgeText: string; label: string
  dot: string
}> = {
  overdue: {
    bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200',
    badge: 'bg-red-100', badgeText: 'text-red-600', label: '已逾期', dot: 'bg-red-400',
  },
  urgent: {
    bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200',
    badge: 'bg-orange-100', badgeText: 'text-orange-600', label: '紧急（3天内）', dot: 'bg-orange-400',
  },
  warning: {
    bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200',
    badge: 'bg-amber-100', badgeText: 'text-amber-600', label: '14天内到期', dot: 'bg-amber-300',
  },
  normal: {
    bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200',
    badge: 'bg-sky-100', badgeText: 'text-sky-600', label: '正常', dot: 'bg-sky-300',
  },
  paid: {
    bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200',
    badge: 'bg-emerald-100', badgeText: 'text-emerald-500', label: '已付款', dot: 'bg-emerald-300',
  },
}

export const STATUS_ORDER: Record<PaymentStatus, number> = {
  overdue: 0, urgent: 1, warning: 2, normal: 3, paid: 4,
}

export const CURRENCY_SYMBOL: Record<string, string> = {
  JPY: '¥', USD: '$', CNY: '￥',
}

export function formatAmount(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOL[currency] ?? currency
  return `${sym} ${amount.toLocaleString()}`
}

/** 按币种统计未付合计（排除已付） */
export function sumByCurrency(payments: Payment[], paidIds: Set<string>): Record<string, number> {
  const result: Record<string, number> = {}
  payments.forEach(p => {
    if (paidIds.has(p.id)) return
    result[p.currency] = (result[p.currency] ?? 0) + p.amount
  })
  return result
}

/** 按币种统计全部应付金额（不排除已付，用于总览） */
export function totalByCurrency(payments: Payment[]): Record<string, number> {
  const result: Record<string, number> = {}
  payments.forEach(p => {
    result[p.currency] = (result[p.currency] ?? 0) + p.amount
  })
  return result
}

/** 按调整后付款日统计当日应付金额（按币种） */
export function dailyAmountByDate(payments: Payment[], paidIds: Set<string>): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {}
  payments.forEach(p => {
    if (paidIds.has(p.id)) return
    const { adjustedDate } = getAdjustedDate(p.dueDate)
    if (!result[adjustedDate]) result[adjustedDate] = {}
    result[adjustedDate][p.currency] = (result[adjustedDate][p.currency] ?? 0) + p.amount
  })
  return result
}

export function getWeekdayName(dateStr: string): string {
  const names = ['日', '一', '二', '三', '四', '五', '六']
  return names[new Date(dateStr).getDay()]
}
