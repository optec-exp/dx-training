'use client'
// useState 示例：FaqItem 自身管理折叠/展开状态，无需父组件干预
import { useState } from 'react'

type Props = {
  q: string
  a: string
}

export default function FaqItem({ q, a }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <span className="faq-chevron">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="faq-a">{a}</div>}
    </div>
  )
}
