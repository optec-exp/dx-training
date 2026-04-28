'use client'
import { useEffect } from 'react'
import type { Term, Lang } from '@/lib/fuzzySearch'
import { getCategoryColor, UI } from '@/lib/translations'

interface Props {
  term: Term
  lang: Lang
  onClose: () => void
}

export default function TermModal({ term, lang, onClose }: Props) {
  const t = UI[lang]
  const color = getCategoryColor(term.category)
  const catLabel = t.categories[term.category] ?? term.category

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const langLabels: Record<string, string> = { zh: '中文', en: 'English', ja: '日本語' }

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-abbr-wrap">
            <span className="modal-abbr" style={{ color }}>{term.abbr}</span>
            <div className="modal-badges">
              <span
                className="cat-badge"
                style={{
                  background: `${color}18`,
                  color,
                  border: `1px solid ${color}30`,
                  fontSize: 11,
                  padding: '3px 10px',
                }}
              >
                {catLabel}
              </span>
              {term.meta?.legacy && (
                <span className="legacy-tag">{t.legacyBadge}</span>
              )}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label={t.close}>✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Full names table */}
          <div>
            <div className="modal-section-title">{t.fullNameLabel}</div>
            <table className="name-table">
              <tbody>
                {(['zh', 'en', 'ja'] as Lang[]).map(l => (
                  <tr key={l}>
                    <td>{langLabels[l]}</td>
                    <td>{term.fullName[l]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Definition */}
          <div>
            <div className="modal-section-title">
              {lang === 'zh' ? '定义' : lang === 'en' ? 'Definition' : '定義'}
            </div>
            <p className="definition-text">{term.definition[lang]}</p>
          </div>

          {/* Legacy notice */}
          {term.meta?.legacy && (
            <div className="legacy-notice">
              <span>⚠</span>
              <span>{t.legacyNote}</span>
            </div>
          )}

          {/* Incoterm meta */}
          {term.category === 'incoterm' && term.meta && (
            <div>
              <div className="modal-section-title">{t.customsLabel}</div>
              <div className="meta-grid">
                {term.meta.transport && (
                  <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
                    <div className="meta-label">{t.transportLabel}</div>
                    <div className="meta-value">
                      {t.transport[term.meta.transport] ?? term.meta.transport}
                    </div>
                  </div>
                )}
                {term.meta.customsExport && (
                  <div className="meta-item">
                    <div className="meta-label">{t.customsExport}</div>
                    <div className={`meta-value ${term.meta.customsExport}`}>
                      {t.party[term.meta.customsExport]}
                    </div>
                  </div>
                )}
                {term.meta.customsImport && (
                  <div className="meta-item">
                    <div className="meta-label">{t.customsImport}</div>
                    <div className={`meta-value ${term.meta.customsImport}`}>
                      {t.party[term.meta.customsImport]}
                    </div>
                  </div>
                )}
                {term.meta.riskTransfer && (
                  <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
                    <div className="meta-label">{t.riskLabel}</div>
                    <div className="meta-value">
                      {lang === 'en'
                        ? term.meta.riskTransfer.en
                        : term.meta.riskTransfer.zh}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
