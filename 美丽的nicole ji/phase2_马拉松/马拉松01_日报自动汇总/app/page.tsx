"use client";
import { useEffect, useState } from "react";

interface Record {
  case_no: string;
  case_name: string;
  client: string;
  assignee: string;
  amount: string;
  status: string;
}

export default function Home() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  useEffect(() => {
    fetch("/api/report")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setRecords(data.records);
      })
      .catch(() => setError("获取数据失败"))
      .finally(() => setLoading(false));
  }, []);

  const totalAmount = records.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-8">
        {/* 标题 */}
        <div className="flex justify-between items-start mb-6 print:mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">日报汇总</h1>
            <p className="text-gray-500 mt-1">{today}</p>
          </div>
          <button
            onClick={() => window.print()}
            className="print:hidden bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            打印 / 保存 PDF
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-700">{records.length}</p>
            <p className="text-sm text-blue-500 mt-1">总案件数</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-700">
              ¥{totalAmount.toLocaleString()}
            </p>
            <p className="text-sm text-green-500 mt-1">合计金额</p>
          </div>
        </div>

        {/* 数据表 */}
        {loading && <p className="text-center text-gray-400 py-8">加载中...</p>}
        {error && <p className="text-center text-red-500 py-8">{error}</p>}
        {!loading && !error && records.length === 0 && (
          <p className="text-center text-gray-400 py-8">今日暂无案件记录</p>
        )}
        {!loading && records.length > 0 && (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="text-left p-3 border border-gray-200">案件番号</th>
                <th className="text-left p-3 border border-gray-200">案件名</th>
                <th className="text-left p-3 border border-gray-200">客户名</th>
                <th className="text-left p-3 border border-gray-200">负责人</th>
                <th className="text-right p-3 border border-gray-200">金额</th>
                <th className="text-center p-3 border border-gray-200">状态</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="p-3 border border-gray-200 font-mono text-xs">{r.case_no || "-"}</td>
                  <td className="p-3 border border-gray-200">{r.case_name || "-"}</td>
                  <td className="p-3 border border-gray-200">{r.client || "-"}</td>
                  <td className="p-3 border border-gray-200">{r.assignee || "-"}</td>
                  <td className="p-3 border border-gray-200 text-right">
                    {r.amount ? `¥${Number(r.amount).toLocaleString()}` : "-"}
                  </td>
                  <td className="p-3 border border-gray-200 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.status === "受付中" ? "bg-yellow-100 text-yellow-700" :
                      r.status === "完了" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {r.status || "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={4} className="p-3 border border-gray-200 text-right">合计</td>
                <td className="p-3 border border-gray-200 text-right">
                  ¥{totalAmount.toLocaleString()}
                </td>
                <td className="p-3 border border-gray-200"></td>
              </tr>
            </tfoot>
          </table>
        )}

        <p className="text-xs text-gray-400 mt-6 text-right print:block">
          数据来源：Kintone App 1046 · 生成时间：{new Date().toLocaleString("zh-CN")}
        </p>
      </div>
    </main>
  );
}
