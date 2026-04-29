'use client'

import { Payment, getPaymentStatus, sumByCurrency, totalByCurrency, formatAmount, CURRENCY_SYMBOL } from '@/lib/paymentUtils'

interface Props {
  payments: Payment[]
  paidIds: Set<string>
  currentDate: Date
}

const CURRENCY_ORDER = ['JPY', 'CNY', 'USD']

function sortedEntries(obj: Record<string, number>) {
  return Object.entries(obj).sort(([a], [b]) => {
    const ia = CURRENCY_ORDER.indexOf(a)
    const ib = CURRENCY_ORDER.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
}

export default function MonthSummary({ payments, paidIds, currentDate }: Props) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`

  const monthPayments = payments.filter(p => p.dueDate.startsWith(monthKey))
  if (monthPayments.length === 0) return null

  const counts = { overdue: 0, urgent: 0, warning: 0, normal: 0, paid: 0 }
  monthPayments.forEach(p => { counts[getPaymentStatus(p.dueDate, paidIds, p.id)]++ })

  const unpaidSums = sumByCurrency(monthPayments, paidIds)
  const totalSums = totalByCurrency(monthPayments)
  const paidSums: Record<string, number> = {}
  monthPayments.filter(p => paidIds.has(p.id)).forEach(p => {
    paidSums[p.currency] = (paidSums[p.currency] ?? 0) + p.amount
  })

  const hasAlert = counts.overdue > 0 || counts.urgent > 0

  return (
    <div className={`rounded-2xl border px-5 py-4 ${hasAlert ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
      {/* Row 1: alert icon + status badges */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          {hasAlert ? (
            <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-sky-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )}
          <span className={`text-sm font-semibold ${hasAlert ? 'text-orange-700' : 'text-gray-700'}`}>
            {month + 1}月付款总览
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {counts.overdue > 0 && (
            <span className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />逾期 {counts.overdue} 笔
            </span>
          )}
          {counts.urgent > 0 && (
            <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />紧急 {counts.urgent} 笔
            </span>
          )}
          {counts.warning > 0 && (
            <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-600 px-2.5 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 inline-block" />14天内 {counts.warning} 笔
            </span>
          )}
          {counts.normal > 0 && (
            <span className="flex items-center gap-1 text-xs bg-sky-100 text-sky-600 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-300 inline-block" />正常 {counts.normal} 笔
            </span>
          )}
          {counts.paid > 0 && (
            <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block" />已付 {counts.paid} 笔
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 my-3" />

      {/* Row 2: currency breakdown table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400">
              <th className="text-left font-medium pb-1.5 pr-6">币种</th>
              <th className="text-right font-medium pb-1.5 pr-6">本月应付总额</th>
              <th className="text-right font-medium pb-1.5 pr-6">已付</th>
              <th className="text-right font-medium pb-1.5">未付余额</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedEntries(totalSums).map(([currency, total]) => {
              const paid = paidSums[currency] ?? 0
              const unpaid = unpaidSums[currency] ?? 0
              const sym = CURRENCY_SYMBOL[currency] ?? currency
              return (
                <tr key={currency} className="text-gray-700">
                  <td className="py-1.5 pr-6">
                    <span className="font-semibold text-gray-500">{currency}</span>
                  </td>
                  <td className="py-1.5 pr-6 text-right font-medium text-gray-700">
                    {sym}{total.toLocaleString()}
                  </td>
                  <td className="py-1.5 pr-6 text-right text-emerald-600">
                    {paid > 0 ? `${sym}${paid.toLocaleString()}` : '—'}
                  </td>
                  <td className={`py-1.5 text-right font-semibold ${unpaid > 0 ? (hasAlert ? 'text-orange-600' : 'text-gray-800') : 'text-emerald-500'}`}>
                    {unpaid > 0 ? `${sym}${unpaid.toLocaleString()}` : '已结清'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
