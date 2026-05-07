'use client'

import { useState, useEffect } from 'react'

const CURRENCIES = ['USD', 'EUR', 'CNY', 'JPY', 'HKD'] as const
type Currency = typeof CURRENCIES[number]

const CURRENCY_INFO: Record<Currency, { name: string; symbol: string; dot: string }> = {
  USD: { name: '美元',  symbol: '$',   dot: 'bg-emerald-400' },
  EUR: { name: '欧元',  symbol: '€',   dot: 'bg-blue-400'    },
  CNY: { name: '人民币', symbol: '¥',  dot: 'bg-red-400'     },
  JPY: { name: '日元',  symbol: '¥',   dot: 'bg-violet-400'  },
  HKD: { name: '港币',  symbol: 'HK$', dot: 'bg-amber-400'   },
}

type Rates = Record<Currency, number>

function convert(amount: number, from: Currency, to: Currency, rates: Rates) {
  if (from === to) return amount
  return (amount / rates[from]) * rates[to]
}

function fmt(v: number, c: Currency) {
  if (isNaN(v)) return '—'
  const d = c === 'JPY' ? 0 : 2
  return v.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d })
}

export default function Home() {
  const [rates, setRates] = useState<Rates | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState('1')
  const [base, setBase] = useState<Currency>('USD')
  const [updatedAt, setUpdatedAt] = useState('')

  useEffect(() => {
    fetch('/api/exchange')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setRates(data as Rates)
        setUpdatedAt(new Date().toLocaleString('zh-CN'))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const num = parseFloat(amount) || 0

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 py-14">

      {/* Header */}
      <div className="mb-8 text-center">
        <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 tracking-widest uppercase">
          Real-time Exchange
        </span>
        <h1 className="text-3xl font-bold text-slate-800">汇率换算</h1>
      </div>

      {/* Single card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-slate-200 overflow-hidden">

        {/* Input */}
        <div className="p-5 bg-gradient-to-br from-blue-600 to-blue-500">
          <p className="text-blue-200 text-xs font-semibold mb-3 uppercase tracking-widest">金额</p>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 text-3xl font-bold text-white bg-transparent border-none outline-none placeholder-blue-300 w-0"
              placeholder="0"
            />
            <select
              value={base}
              onChange={e => setBase(e.target.value as Currency)}
              className="text-sm font-bold text-blue-700 bg-white rounded-xl px-3 py-2 border-none outline-none cursor-pointer"
            >
              {CURRENCIES.map(c => (
                <option key={c} value={c}>{c} · {CURRENCY_INFO[c].name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="p-10 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm">正在获取汇率…</p>
          </div>
        )}
        {error && (
          <div className="p-8 text-center text-red-400 text-sm">⚠️ {error}</div>
        )}
        {rates && (
          <div className="divide-y divide-slate-50">
            {CURRENCIES.filter(c => c !== base).map(target => {
              const result = convert(num, base, target, rates)
              const rate   = convert(1,   base, target, rates)
              return (
                <div key={target} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${CURRENCY_INFO[target].dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{target} · {CURRENCY_INFO[target].name}</p>
                    <p className="text-xs text-slate-400">1 {base} = {fmt(rate, target)} {target}</p>
                  </div>
                  <p className="text-lg font-bold text-slate-800 tabular-nums">
                    {CURRENCY_INFO[target].symbol}{fmt(result, target)}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Reference table */}
        {rates && (
          <>
            <div className="mx-5 border-t border-dashed border-slate-200" />
            <div className="px-5 py-4">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-3">参考汇率（基准 1 USD）</p>
              <div className="grid grid-cols-5 gap-1 text-center">
                {CURRENCIES.map(c => (
                  <div key={c} className="flex flex-col items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${CURRENCY_INFO[c].dot}`} />
                    <p className="text-xs font-bold text-slate-600">{c}</p>
                    <p className="text-xs font-mono text-slate-500 leading-tight">
                      {rates[c].toFixed(c === 'JPY' ? 1 : 3)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between text-xs text-slate-400">
              <span>FreeCurrencyAPI</span>
              <span>{updatedAt}</span>
            </div>
          </>
        )}

      </div>
    </main>
  )
}
