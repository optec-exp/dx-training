'use client'

import { useState } from 'react'
import ClassifyView from '@/components/ClassifyView'
import HistoryView from '@/components/HistoryView'
import StatsView from '@/components/StatsView'

const TABS = [
  { key: 'classify', label: '分类' },
  { key: 'history', label: '历史记录' },
  { key: 'stats', label: '统计' },
]

export default function Home() {
  const [tab, setTab] = useState('classify')

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">AI 数据分类工具</h1>

        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'classify' && <ClassifyView />}
        {tab === 'history' && <HistoryView />}
        {tab === 'stats' && <StatsView />}
      </div>
    </main>
  )
}
