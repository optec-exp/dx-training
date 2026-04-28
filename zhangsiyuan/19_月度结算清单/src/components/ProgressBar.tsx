'use client'
import { UI } from '@/lib/translations'
import type { Lang } from '@/lib/types'

interface Props {
  done: number
  total: number
  lang: Lang
  onReset: () => void
}

export default function ProgressBar({ done, total, lang, onReset }: Props) {
  const t = UI[lang]
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const allDone = done === total && total > 0

  return (
    <div className={`progress-card${allDone ? ' all-done' : ''}`}>
      {allDone ? (
        <div className="all-done-msg">{t.allDone}</div>
      ) : (
        <>
          <div className="progress-header">
            <span className="progress-text">{t.progress(done, total)}</span>
            <span className="progress-rate">{t.progressRate(pct)}</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      )}
      <div className="progress-footer">
        <div className="progress-segments">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`seg${i < done ? ' done' : ''}`} />
          ))}
        </div>
        <button className="reset-btn" onClick={onReset}>{t.resetAll}</button>
      </div>
    </div>
  )
}
