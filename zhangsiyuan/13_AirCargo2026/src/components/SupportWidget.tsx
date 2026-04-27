'use client'
// useState 示例：SupportWidget 管理浮动面板的开/关状态
import { useState } from 'react'
import type { T } from '@/data/translations'

type Props = {
  t: T['support']
}

export default function SupportWidget({ t }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="sw-root">
      {open && (
        <div className="sw-panel">
          <div className="sw-header">
            <span className="sw-title">{t.title}</span>
            <button className="sw-close" onClick={() => setOpen(false)}>{t.close}</button>
          </div>
          <div className="sw-body">
            <div className="sw-row">
              <span className="sw-label">{t.hours_label}</span>
              <span className="sw-value">{t.hours}</span>
            </div>
            <div className="sw-tz">{t.tz}</div>
            <div className="sw-note">{t.note}</div>
            <div className="sw-row sw-email-row">
              <span className="sw-label">{t.email_label}</span>
              <a href={`mailto:${t.email}`} className="sw-email">{t.email}</a>
            </div>
          </div>
        </div>
      )}
      <button className="sw-btn" onClick={() => setOpen(!open)}>
        <span className="sw-btn-icon">💬</span>
        <span className="sw-btn-label">{t.btn_label}</span>
      </button>
    </div>
  )
}
