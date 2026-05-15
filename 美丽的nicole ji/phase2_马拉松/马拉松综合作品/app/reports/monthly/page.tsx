"use client";
import { useState } from "react";

interface ClientRow {
  name: string;
  count: number;
  total: number;
  cases: string[];
}

interface ReportData {
  clients: ClientRow[];
  grandTotal: number;
  recordCount: number;
}

export default function MonthlyReportPage() {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch(`/api/report-monthly?month=${month}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "获取失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-8">
      {/* 标题 */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">月度客户实绩报告</h1>
          <p className="text-sm text-gray-500 mt-1">按客户汇总当月案件数量与金额</p>
        </div>
        {data && (
          <button
            onClick={() => window.print()}
            className="print:hidden bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            打印 / PDF
          </button>
        )}
      </div>

      {/* 月份选择 */}
      <div className="flex gap-3 mb-6 print:hidden">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-gray-400 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={fetchReport}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-medium"
        >
          {loading ? "生成中..." : "生成报告"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      {/* 报告内容 */}
      {data && (
        <>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 hidden print:block">
            {month} 月度客户实绩报告
          </h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-700">{data.recordCount}</p>
              <p className="text-sm text-blue-500 mt-1">总案件数</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-700">{data.clients.length}</p>
              <p className="text-sm text-green-500 mt-1">客户数</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">
                ¥{data.grandTotal.toLocaleString()}
              </p>
              <p className="text-sm text-purple-500 mt-1">合计金额</p>
            </div>
          </div>

          {data.clients.length === 0 ? (
            <p className="text-center text-gray-400 py-8">该月暂无数据</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="text-left p-3 border border-gray-200">排名</th>
                  <th className="text-left p-3 border border-gray-200">客户名</th>
                  <th className="text-center p-3 border border-gray-200">案件数</th>
                  <th className="text-right p-3 border border-gray-200">合计金额</th>
                  <th className="text-right p-3 border border-gray-200">占比</th>
                  <th className="text-left p-3 border border-gray-200">案件列表</th>
                </tr>
              </thead>
              <tbody>
                {data.clients.map((c, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-3 border border-gray-200 text-center font-bold text-gray-400">
                      {i + 1}
                    </td>
                    <td className="p-3 border border-gray-200 font-medium">{c.name}</td>
                    <td className="p-3 border border-gray-200 text-center">{c.count}</td>
                    <td className="p-3 border border-gray-200 text-right font-mono">
                      ¥{c.total.toLocaleString()}
                    </td>
                    <td className="p-3 border border-gray-200 text-right">
                      {data.grandTotal > 0
                        ? ((c.total / data.grandTotal) * 100).toFixed(1) + "%"
                        : "-"}
                    </td>
                    <td className="p-3 border border-gray-200 text-xs text-gray-500">
                      {c.cases.slice(0, 3).join("、")}
                      {c.cases.length > 3 ? ` 等${c.cases.length}件` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={3} className="p-3 border border-gray-200 text-right">合计</td>
                  <td className="p-3 border border-gray-200 text-right font-mono">
                    ¥{data.grandTotal.toLocaleString()}
                  </td>
                  <td colSpan={2} className="p-3 border border-gray-200"></td>
                </tr>
              </tfoot>
            </table>
          )}

          <p suppressHydrationWarning className="text-xs text-gray-400 mt-4 text-right">
            数据来源：Kintone App 1046 · 生成时间：{new Date().toLocaleString("zh-CN")}
          </p>
        </>
      )}
    </div>
  );
}
