import Link from "next/link";

const categories = [
  {
    title: "报告",
    icon: "📊",
    color: "bg-blue-50 border-blue-200",
    headerColor: "text-blue-700",
    items: [
      { href: "/reports/daily", label: "01 日报自动汇总", desc: "Kintone日报 → 页面展示 + PDF打印" },
      { href: "/reports/monthly", label: "02 月度客户报告", desc: "按客户分组 + 占比 + PDF" },
      { href: "/reports/weekly", label: "05 周报邮件草稿", desc: "自动生成周报邮件内容" },
    ],
  },
  {
    title: "提醒",
    icon: "🔔",
    color: "bg-red-50 border-red-200",
    headerColor: "text-red-700",
    items: [
      { href: "/alerts/payment", label: "06 付款期限提醒", desc: "显示即将到期或已逾期付款" },
      { href: "/alerts/sla", label: "07 SLA违规检测", desc: "检查超出服务水平协议的案件" },
      { href: "/alerts/followup", label: "08 案件未跟进提醒", desc: "长时间未更新的案件提醒" },
      { href: "/alerts/rate", label: "09 汇率异常警报", desc: "检测异常汇率波动" },
      { href: "/alerts/inventory", label: "10 库存不足通知", desc: "库存低于阈值时发送通知" },
    ],
  },
  {
    title: "文档",
    icon: "📄",
    color: "bg-green-50 border-green-200",
    headerColor: "text-green-700",
    items: [
      { href: "/docs/awb-pdf", label: "03 AWB清单PDF", desc: "生成航空运单清单PDF" },
      { href: "/docs/delay", label: "04 航班延误报告", desc: "生成航班延误报告书" },
      { href: "/docs/email", label: "16 邮件模板填充", desc: "从Kintone自动填充邮件模板" },
      { href: "/docs/quote", label: "18 一键报价单", desc: "快速生成客户报价单" },
      { href: "/docs/meeting", label: "19 会议记录整理", desc: "整理并保存会议记录" },
    ],
  },
  {
    title: "数据操作",
    icon: "🔄",
    color: "bg-purple-50 border-purple-200",
    headerColor: "text-purple-700",
    items: [
      { href: "/data/excel-import", label: "11 Excel导入Kintone", desc: "批量导入Excel数据到Kintone" },
      { href: "/data/kintone-sheets", label: "12 Kintone同步Sheets", desc: "将Kintone数据同步到Google Sheets" },
      { href: "/data/cross-app", label: "13 Kintone跨App复制", desc: "在不同Kintone App间复制记录" },
      { href: "/data/csv-contacts", label: "14 CSV联系人导入", desc: "从CSV批量导入联系人" },
      { href: "/data/sheets-kintone", label: "15 Sheets同步Kintone", desc: "Google Sheets数据写回Kintone" },
      { href: "/data/awb-update", label: "17 AWB批量状态更新", desc: "批量更新AWB运单状态" },
    ],
  },
  {
    title: "客户管理",
    icon: "👥",
    color: "bg-orange-50 border-orange-200",
    headerColor: "text-orange-700",
    items: [
      { href: "/clients/contact-log", label: "20 客户联系记录", desc: "记录和查看客户沟通历史" },
    ],
  },
];

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Phase2 综合作品</h1>
        <p className="text-gray-500 mt-1">马拉松 01–20 全功能整合 · 共 20 个模块</p>
      </div>

      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.title} className={`border rounded-2xl p-6 ${cat.color}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{cat.icon}</span>
              <h2 className={`text-lg font-bold ${cat.headerColor}`}>{cat.title}</h2>
              <span className="text-xs text-gray-400 ml-1">({cat.items.length} 个功能)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-white hover:border-gray-200"
                >
                  <p className="font-medium text-gray-800 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-8 text-center">
        数据来源：Kintone App {process.env.NEXT_PUBLIC_APP_ID || "1046"} · Phase2 综合作品
      </p>
    </div>
  );
}
