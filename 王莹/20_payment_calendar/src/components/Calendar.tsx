'use client'

import { Payment, getPaymentStatus, getAdjustedDate, dailyAmountByDate, PaymentStatus, CURRENCY_SYMBOL } from '@/lib/paymentUtils'

interface Props {
  payments: Payment[]
  paidIds: Set<string>
  currentDate: Date
  selectedDate: string | null
  onMonthChange: (d: Date) => void
  onDateSelect: (date: string | null) => void
}

const DOT_COLOR: Record<PaymentStatus, string> = {
  overdue: 'bg-red-400',
  urgent: 'bg-orange-400',
  warning: 'bg-amber-300',
  normal: 'bg-sky-300',
  paid: 'bg-emerald-300',
}

// 金额缩写：超过10000显示为万/K
function shortAmount(sym: string, amount: number, currency: string): string {
  if (currency === 'JPY' && amount >= 10000) return `${sym}${(amount / 10000).toFixed(amount % 10000 === 0 ? 0 : 1)}万`
  if ((currency === 'USD' || currency === 'CNY') && amount >= 1000) return `${sym}${(amount / 1000).toFixed(1)}K`
  return `${sym}${amount.toLocaleString()}`
}

const CURRENCY_ORDER = ['JPY', 'CNY', 'USD']

export default function Calendar({ payments, paidIds, currentDate, selectedDate, onMonthChange, onDateSelect }: Props) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 按调整后付款日分组：状态点
  const byAdjusted: Record<string, { status: PaymentStatus; isWeekendAdjusted: boolean }[]> = {}
  payments.forEach(p => {
    const status = getPaymentStatus(p.dueDate, paidIds, p.id)
    const { adjustedDate, isWeekendAdjusted } = getAdjustedDate(p.dueDate)
    if (!byAdjusted[adjustedDate]) byAdjusted[adjustedDate] = []
    byAdjusted[adjustedDate].push({ status, isWeekendAdjusted })
  })

  // 按日期的未付金额（含已付则不计）
  const dailyAmounts = dailyAmountByDate(payments, paidIds)

  function formatDateKey(d: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const weekdays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <button
          onClick={() => onMonthChange(new Date(year, month - 1, 1))}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-800">{year}年 {month + 1}月</h2>
          {!(year === new Date().getFullYear() && month === new Date().getMonth()) && (
            <button
              onClick={() => onMonthChange(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
              className="text-xs px-2 py-0.5 rounded-md bg-[#b8933a]/10 text-[#b8933a] hover:bg-[#b8933a]/20 transition-colors font-medium"
            >
              本月
            </button>
          )}
        </div>
        <button
          onClick={() => onMonthChange(new Date(year, month + 1, 1))}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 px-3 pt-4 pb-1">
        {weekdays.map((d, i) => (
          <div key={d} className={`text-center text-xs font-medium py-1
            ${i === 0 ? 'text-red-400' : i === 6 ? 'text-sky-400' : 'text-gray-400'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 px-3 pb-4 gap-y-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateKey = formatDateKey(day)
          const dayPayments = byAdjusted[dateKey] || []
          const amountsByDay = dailyAmounts[dateKey] ?? {}
          const colIndex = (firstDay + i) % 7
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
          const isSelected = selectedDate === dateKey
          const isSunday = colIndex === 0
          const isSaturday = colIndex === 6
          const isWeekend = isSunday || isSaturday
          const hasWeekendAdjusted = dayPayments.some(p => p.isWeekendAdjusted)

          const topStatus = (['overdue', 'urgent', 'warning', 'normal', 'paid'] as PaymentStatus[])
            .find(s => dayPayments.some(p => p.status === s))

          const cellBg = isSelected
            ? 'bg-[#b8933a]/10 ring-1 ring-[#b8933a]/40'
            : isWeekend ? 'bg-gray-50/60'
            : topStatus === 'overdue' ? 'hover:bg-red-50'
            : topStatus === 'urgent' ? 'hover:bg-orange-50'
            : dayPayments.length > 0 ? 'hover:bg-sky-50/50'
            : 'hover:bg-gray-50'

          // 排序显示：JPY CNY USD
          const sortedAmounts = Object.entries(amountsByDay)
            .sort(([a], [b]) => {
              const ia = CURRENCY_ORDER.indexOf(a)
              const ib = CURRENCY_ORDER.indexOf(b)
              return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
            })

          return (
            <button
              key={day}
              onClick={() => !isWeekend && onDateSelect(isSelected ? null : dateKey)}
              className={`relative flex flex-col items-center rounded-xl pt-1.5 pb-2 px-0.5 transition-colors min-h-[68px]
                ${isWeekend ? 'cursor-default' : 'cursor-pointer'}
                ${cellBg}`}
            >
              {/* Date number */}
              <span className={`text-sm w-6 h-6 flex items-center justify-center rounded-full font-medium flex-shrink-0
                ${isToday ? 'bg-[#b8933a] text-white'
                  : isSunday ? 'text-red-300'
                  : isSaturday ? 'text-sky-300'
                  : 'text-gray-700'}`}>
                {day}
              </span>

              {/* Status dots */}
              {dayPayments.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {dayPayments.slice(0, 3).map((p, idx) => (
                    <span key={idx} className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT_COLOR[p.status]}`} />
                  ))}
                  {dayPayments.length > 3 && (
                    <span className="text-[8px] text-gray-400 leading-none">+{dayPayments.length - 3}</span>
                  )}
                </div>
              )}

              {/* Daily amounts by currency */}
              {sortedAmounts.length > 0 && (
                <div className="mt-1 w-full flex flex-col items-center gap-0.5">
                  {sortedAmounts.map(([currency, amount]) => {
                    const sym = CURRENCY_SYMBOL[currency] ?? currency
                    const colorClass = currency === 'JPY' ? 'text-sky-600'
                      : currency === 'CNY' ? 'text-amber-600'
                      : 'text-emerald-600'
                    return (
                      <span key={currency} className={`text-[10px] leading-tight font-medium ${colorClass}`}>
                        {shortAmount(sym, amount, currency)}
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Weekend-adjusted marker */}
              {hasWeekendAdjusted && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-violet-300" />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="px-5 pb-4 flex items-center gap-4 text-[11px] text-gray-400 border-t border-gray-50 pt-3">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-300 inline-block" />周末顺延项
        </span>
        <span className="flex items-center gap-1"><span className="font-medium text-sky-600">¥</span>JPY</span>
        <span className="flex items-center gap-1"><span className="font-medium text-amber-600">￥</span>CNY</span>
        <span className="flex items-center gap-1"><span className="font-medium text-emerald-600">$</span>USD</span>
      </div>
    </div>
  )
}
