import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Phase2 综合作品",
  description: "马拉松01-20 整合项目",
};

const navGroups = [
  {
    label: "报告",
    icon: "📊",
    items: [
      { href: "/reports/daily", label: "日报汇总" },
      { href: "/reports/monthly", label: "月度客户报告" },
      { href: "/reports/weekly", label: "周报邮件" },
    ],
  },
  {
    label: "提醒",
    icon: "🔔",
    items: [
      { href: "/alerts/payment", label: "付款期限提醒" },
      { href: "/alerts/sla", label: "SLA违规检测" },
      { href: "/alerts/followup", label: "案件未跟进" },
      { href: "/alerts/rate", label: "汇率异常警报" },
      { href: "/alerts/inventory", label: "库存不足通知" },
    ],
  },
  {
    label: "文档",
    icon: "📄",
    items: [
      { href: "/docs/awb-pdf", label: "AWB清单PDF" },
      { href: "/docs/delay", label: "航班延误报告" },
      { href: "/docs/email", label: "邮件模板填充" },
      { href: "/docs/quote", label: "一键报价单" },
      { href: "/docs/meeting", label: "会议记录整理" },
    ],
  },
  {
    label: "数据操作",
    icon: "🔄",
    items: [
      { href: "/data/excel-import", label: "Excel导入Kintone" },
      { href: "/data/kintone-sheets", label: "Kintone同步Sheets" },
      { href: "/data/cross-app", label: "Kintone跨App复制" },
      { href: "/data/csv-contacts", label: "CSV联系人导入" },
      { href: "/data/sheets-kintone", label: "Sheets同步Kintone" },
      { href: "/data/awb-update", label: "AWB批量状态更新" },
    ],
  },
  {
    label: "客户管理",
    icon: "👥",
    items: [
      { href: "/clients/contact-log", label: "客户联系记录" },
    ],
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 text-gray-900">
        {/* 侧边栏 */}
        <aside className="fixed top-0 left-0 h-screen w-56 bg-gray-900 text-white overflow-y-auto z-50 flex flex-col">
          <div className="px-4 py-5 border-b border-gray-700">
            <h1 className="text-sm font-bold text-white leading-tight">Phase2 综合作品</h1>
            <p className="text-xs text-gray-400 mt-0.5">马拉松 01-20</p>
          </div>
          <nav className="flex-1 px-2 py-3 space-y-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-1.5 px-2 mb-1">
                  <span className="text-xs">{group.icon}</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{group.label}</span>
                </div>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block px-3 py-1.5 text-xs text-gray-300 rounded hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="px-4 py-3 border-t border-gray-700">
            <Link href="/" className="block text-xs text-gray-400 hover:text-white transition-colors">
              ← 返回首页
            </Link>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="ml-56 min-h-screen p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
