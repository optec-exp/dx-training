'use client'
import { UI } from '@/lib/translations'
import type { Lang } from '@/lib/types'

interface Props {
  total: number
  departedCount: number
  arrivedCount: number
  overdueCount: number
  lang: Lang
  onReset: () => void
}

export default function ProgressSummary({
  total, departedCount, arrivedCount, overdueCount, lang, onReset,
}: Props) {
  const t = UI[lang]
  const pct = total === 0 ? 0 : Math.round((arrivedCount / total) * 100)
  const allDone = arrivedCount === total && total > 0

  return (
    <div className={`summary-card${allDone ? ' all-done' : ''}`}>
      {allDone ? (
        <div className="all-done-msg">🎉 {arrivedCount === total ? (lang === 'zh' ? '全部货物已到达！' : lang === 'en' ? 'All shipments delivered!' : 'すべての貨物が到着しました！') : ''}</div>
      ) : (
        <>
          <div className="summary-top">
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-num">{arrivedCount}</span>
                <span className="stat-label">/ {total}</span>
              </div>
              <div className="stat-pct">{pct}%</div>
            </div>
            <div className="summary-pills">
              <span className="pill pill-departed">{t.departedCount(departedCount)}</span>
              {overdueCount > 0 && (
                <span className="pill pill-overdue">{t.overdueCount(overdueCount)}</span>
              )}
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="summary-sublabel">{t.progress(arrivedCount, total)}</div>
        </>
      )}
      <div className="summary-footer">
        <button className="reset-btn" onClick={onReset}>{t.resetAll}</button>
      </div>
    </div>
  )
}
