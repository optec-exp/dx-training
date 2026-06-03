'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Plus, ListTodo, CheckCircle2, FileText, Trash2, ShieldCheck } from 'lucide-react'

const items = [
  { href: '/',             label: '看板',     icon: LayoutDashboard, match: 'exact' },
  { href: '/ncr/new',      label: '新建 NCR', icon: Plus },
  { href: '/ncr/todo',     label: '待办',     icon: ListTodo },
  { href: '/ncr/closed',   label: '已结案',   icon: CheckCircle2 },
  { href: '/reports',      label: '历史报告', icon: FileText },
  { href: '/ncr/deleted',  label: '已删除',   icon: Trash2 },
]

export default function Navbar() {
  const pathname = usePathname()
  // 报告页(/ncr/:id/report/...)是独立打印视图,不显示全局导航
  if (pathname?.includes('/report/')) return null
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-600 text-white">
            <ShieldCheck size={20} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">OPTEC QMS</div>
            <div className="text-[11px] text-slate-500">NCR · CAPA 闭环</div>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          {items.map((item) => {
            const Icon = item.icon
            const active = item.match === 'exact'
              ? pathname === item.href
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
