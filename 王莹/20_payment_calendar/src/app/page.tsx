'use client'

import { useState, useEffect, useRef } from 'react'
import Calendar from '@/components/Calendar'
import PaymentList from '@/components/PaymentList'
import MonthSummary from '@/components/MonthSummary'
import { Payment } from '@/lib/paymentUtils'

export default function Home() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set())
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 4, 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [calendarHeight, setCalendarHeight] = useState<number | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/payments.json').then(r => r.json()).then(setPayments)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('payment_paid_ids')
    if (stored) setPaidIds(new Set(JSON.parse(stored)))
  }, [])

  useEffect(() => {
    const el = calendarRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      setCalendarHeight(entries[0].contentRect.height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  function togglePaid(id: string) {
    setPaidIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem('payment_paid_ids', JSON.stringify([...next]))
      return next
    })
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#b8933a]/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#b8933a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800 leading-tight">付款期限管理日历</h1>
            <p className="text-xs text-gray-400">Payment Deadline Calendar</p>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />已逾期</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />3天内</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-300 inline-block" />14天内</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-300 inline-block" />正常</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-300 inline-block" />已付款</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-5 space-y-5">
        <MonthSummary payments={payments} paidIds={paidIds} currentDate={currentDate} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5 items-start">
          {/* 日历：自然高度，ref 用于测量 */}
          <div ref={calendarRef}>
            <Calendar
              payments={payments}
              paidIds={paidIds}
              currentDate={currentDate}
              selectedDate={selectedDate}
              onMonthChange={d => { setCurrentDate(d); setSelectedDate(null) }}
              onDateSelect={setSelectedDate}
            />
          </div>

          {/* 付款清单：高度严格等于日历 */}
          <div style={calendarHeight ? { height: calendarHeight } : undefined} className="flex flex-col overflow-hidden">
            <PaymentList
              payments={payments}
              paidIds={paidIds}
              currentDate={currentDate}
              selectedDate={selectedDate}
              onTogglePaid={togglePaid}
              onClearFilter={() => setSelectedDate(null)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
