'use client'

import {
  Payment, PaymentStatus, getPaymentStatus, getDaysUntilDue, getAdjustedDate,
  STATUS_STYLES, STATUS_ORDER, formatAmount, sumByCurrency, CURRENCY_SYMBOL,
  getWeekdayName
} from '@/lib/paymentUtils'

interface Props {
  payments: Payment[]
  paidIds: Set<string>
  currentDate: Date
  selectedDate: string | null
  onTogglePaid: (id: string) => void
  onClearFilter: () => void
}

const STATUS_LABELS: Partial<Record<PaymentStatus, string>> = {
  overdue: '已逾期',
  urgent: '紧急（3天内）',
  warning: '14天内到期',
  normal: '正常',
  paid: '已付款',
}

const CURRENCY_ORDER = ['JPY', 'CNY', 'USD']

function sortedCurrencyEntries(obj: Record<string, number>) {
  return Object.entries(obj).sort(([a], [b]) => {
    const ia = CURRENCY_ORDER.indexOf(a)
    const ib = CURRENCY_ORDER.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
}

export default function PaymentList({ payments, paidIds, currentDate, selectedDate, onTogglePaid, onClearFilter }: Props) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`

  let filtered = payments.filter(p => {
    if (selectedDate) {
      const { adjustedDate } = getAdjustedDate(p.dueDate)
      return adjustedDate === selectedDate
    }
    return p.dueDate.startsWith(monthKey)
  })

  filtered = [...filtered].sort((a, b) => {
    const sa = getPaymentStatus(a.dueDate, paidIds, a.id)
    const sb = getPaymentStatus(b.dueDate, paidIds, b.id)
    if (STATUS_ORDER[sa] !== STATUS_ORDER[sb]) return STATUS_ORDER[sa] - STATUS_ORDER[sb]
    return a.dueDate.localeCompare(b.dueDate)
  })

  // 按档位分组
  const groups: Partial<Record<PaymentStatus, Payment[]>> = {}
  filtered.forEach(p => {
    const s = getPaymentStatus(p.dueDate, paidIds, p.id)
    if (!groups[s]) groups[s] = []
    groups[s]!.push(p)
  })
  const groupOrder: PaymentStatus[] = ['overdue', 'urgent', 'warning', 'normal', 'paid']

  const unpaidSums = sumByCurrency(filtered, paidIds)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          {selectedDate
            ? `${selectedDate}（周${getWeekdayName(selectedDate)}）`
            : `${month + 1}月付款清单`}
        </h3>
        {selectedDate && (
          <button onClick={onClearFilter} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            清除筛选
          </button>
        )}
      </div>

      {/* List body */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-300">
            <svg className="w-9 h-9 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">暂无付款记录</p>
          </div>
        ) : (
          groupOrder.map(status => {
            const items = groups[status]
            if (!items || items.length === 0) return null
            const styles = STATUS_STYLES[status]

            // 该组内的币种合计
            const groupSums: Record<string, number> = {}
            items.forEach(p => {
              if (status !== 'paid') groupSums[p.currency] = (groupSums[p.currency] ?? 0) + p.amount
            })

            return (
              <div key={status}>
                {/* Group header */}
                <div className={`flex items-center justify-between px-5 py-2 ${styles.bg} border-b ${styles.border}`}>
                  <span className={`text-xs font-semibold flex items-center gap-1.5 ${styles.badgeText}`}>
                    <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
                    {STATUS_LABELS[status]}
                    <span className="font-normal text-gray-400">（{items.length} 笔）</span>
                  </span>
                  {status !== 'paid' && Object.keys(groupSums).length > 0 && (
                    <div className="flex items-center gap-2">
                      {sortedCurrencyEntries(groupSums).map(([currency, total]) => (
                        <span key={currency} className={`text-xs font-semibold ${styles.text}`}>
                          {CURRENCY_SYMBOL[currency] ?? currency}{total.toLocaleString()}
                          <span className="text-[10px] font-normal text-gray-400 ml-0.5">{currency}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Group items */}
                <div className="divide-y divide-gray-50">
                  {items.map(p => {
                    const days = getDaysUntilDue(p.dueDate)
                    const { adjustedDate, isWeekendAdjusted } = getAdjustedDate(p.dueDate)
                    const isPaid = status === 'paid'

                    return (
                      <div key={p.id} className={`px-5 py-3.5 flex gap-3 items-start ${styles.bg}`}>
                        {/* Checkbox */}
                        <button
                          onClick={() => onTogglePaid(p.id)}
                          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all
                            ${isPaid ? 'border-emerald-400 bg-emerald-100' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
                        >
                          {isPaid && (
                            <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <p className={`text-sm font-medium leading-snug ${isPaid ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {p.title}
                          </p>

                          {/* Meta */}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-400">{p.counterparty}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{p.category}</span>
                          </div>

                          {/* Date + amount */}
                          <div className="flex items-end justify-between mt-2 gap-2 flex-wrap">
                            <div className="flex flex-col gap-0.5">
                              {isWeekendAdjusted ? (
                                <>
                                  <span className="text-xs text-gray-400 line-through">
                                    原到期日：{p.dueDate}（周{getWeekdayName(p.dueDate)}）
                                  </span>
                                  <span className={`text-xs font-medium flex items-center gap-1 ${styles.text}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-300 inline-block flex-shrink-0" />
                                    顺延至：{adjustedDate}（周{getWeekdayName(adjustedDate)}）
                                    {!isPaid && (
                                      <span className="text-gray-400 font-normal">
                                        {days < 0 ? `逾期${Math.abs(days)}天` : days === 0 ? '今天' : `${days}天后`}
                                      </span>
                                    )}
                                  </span>
                                </>
                              ) : (
                                <span className={`text-xs ${isPaid ? 'text-gray-400' : styles.text}`}>
                                  {isPaid ? p.dueDate : adjustedDate}（周{getWeekdayName(adjustedDate)}）
                                  {!isPaid && (
                                    <span className="text-gray-400 ml-1">
                                      {days < 0 ? `逾期${Math.abs(days)}天` : days === 0 ? '今天到期' : `${days}天后`}
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                            <span className={`text-sm font-semibold flex-shrink-0 ${isPaid ? 'text-gray-400' : styles.text}`}>
                              {formatAmount(p.amount, p.currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer: multi-currency unpaid totals */}
      {filtered.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 space-y-1.5">
          {Object.keys(unpaidSums).length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
              <span className="text-xs text-gray-400">未付合计</span>
              {sortedCurrencyEntries(unpaidSums).map(([currency, total]) => (
                <span key={currency} className="text-xs font-semibold text-gray-700">
                  {CURRENCY_SYMBOL[currency] ?? currency}{total.toLocaleString()}
                  <span className="font-normal text-gray-400 ml-0.5 text-[11px]">{currency}</span>
                </span>
              ))}
            </div>
          )}
          <div className="flex justify-between text-xs text-gray-400">
            <span>共 {filtered.length} 笔</span>
            <span>已付 {filtered.filter(p => paidIds.has(p.id)).length} / 未付 {filtered.filter(p => !paidIds.has(p.id)).length}</span>
          </div>
        </div>
      )}
    </div>
  )
}
