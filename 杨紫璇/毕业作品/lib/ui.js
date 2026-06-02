'use client'

import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// 替代 browser confirm():弹一个带「确认 / 取消」的 toast
export function confirmToast(message, onConfirm, opts = {}) {
  toast(message, {
    duration: 10000,
    description: opts.description,
    action: { label: opts.confirmLabel || '确认', onClick: onConfirm },
    cancel: { label: '取消', onClick: () => {} },
  })
}

// 旋转的 loading 图标
export function Spinner({ size = 16, className = '' }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} aria-label="加载中" />
}

// 空状态卡片(列表无数据时)
export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white p-12 text-center">
      {Icon && <Icon size={40} className="mb-3 text-slate-300" />}
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

// 加载中行(全页加载状态)
export function LoadingRow({ text = '加载中…' }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <Spinner />
      {text}
    </div>
  )
}

// 筛选行 — 左侧 label + 右侧一排按钮
export function FilterRow({ label, children }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-10 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </div>
  )
}

// 筛选按钮(active=已选中,绿色)
export function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
        active ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

// 把 toast.success / toast.error 暴露,方便统一引用
export { toast }
