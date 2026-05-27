import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">费用申请管理系统</h1>
      <p className="text-gray-600 mb-8">作品 40A — 基于 Supabase 的多状态工作流</p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold border-b pb-2">功能导航</h2>

        <Link
          href="/applications/new"
          className="block border border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded p-4 transition"
        >
          <div className="font-semibold text-blue-700">📝 新建费用申请</div>
          <div className="text-sm text-gray-600 mt-1">填写申请人、类别、金额、摘要，创建草稿</div>
        </Link>

        <Link
          href="/applications"
          className="block border border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded p-4 transition"
        >
          <div className="font-semibold text-blue-700">📋 申请列表</div>
          <div className="text-sm text-gray-600 mt-1">按状态筛选 + 详情页 + 历史记录</div>
        </Link>

        <Link
          href="/summary"
          className="block border border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded p-4 transition"
        >
          <div className="font-semibold text-blue-700">📊 月度汇总</div>
          <div className="text-sm text-gray-600 mt-1">按月份 + 类别统计已完成的费用</div>
        </Link>

        <Link
          href="/ping"
          className="block border border-gray-200 hover:border-gray-400 rounded p-4 transition text-sm text-gray-600"
        >
          🔧 Supabase 连接诊断（开发用）
        </Link>
      </section>
    </main>
  );
}
