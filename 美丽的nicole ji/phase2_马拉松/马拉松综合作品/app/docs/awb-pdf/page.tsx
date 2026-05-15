"use client";
import { useEffect, useState } from "react";

interface Row { case_no: string; case_name: string; client: string; assignee: string; amount: string; status: string; }

export default function AwbPdfPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = new Date().toLocaleDateString("zh-CN");

  useEffect(() => {
    fetch("/api/report").then(r => r.json()).then(d => {
      if (d.error) setError(d.error); else setRows(d.records);
    }).catch(() => setError("获取失败")).finally(() => setLoading(false));
  }, []);

  const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">AWB 清单</h1>
            <p className="text-gray-500 text-sm mt-1">生成日期：{today} · 共 {rows.length} 件</p>
          </div>
          <button onClick={() => window.print()}
            className="print:hidden bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            打印 / 保存 PDF
          </button>
        </div>

        {loading && <p className="text-center text-gray-400 py-8">加载中...</p>}
        {error && <p className="text-center text-red-500 py-8">{error}</p>}
        {!loading && !error && (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="p-3 text-left">No.</th>
                <th className="p-3 text-left">AWB番号</th>
                <th className="p-3 text-left">案件名</th>
                <th className="p-3 text-left">客户名</th>
                <th className="p-3 text-left">负责人</th>
                <th className="p-3 text-right">金额</th>
                <th className="p-3 text-center">状态</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="p-3 border-b border-gray-200 text-gray-400">{i + 1}</td>
                  <td className="p-3 border-b border-gray-200 font-mono text-xs font-bold">{r.case_no || "-"}</td>
                  <td className="p-3 border-b border-gray-200">{r.case_name || "-"}</td>
                  <td className="p-3 border-b border-gray-200">{r.client || "-"}</td>
                  <td className="p-3 border-b border-gray-200">{r.assignee || "-"}</td>
                  <td className="p-3 border-b border-gray-200 text-right font-mono">
                    {r.amount ? `¥${Number(r.amount).toLocaleString()}` : "-"}
                  </td>
                  <td className="p-3 border-b border-gray-200 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      r.status === "受付中" ? "bg-yellow-100 text-yellow-700" :
                      r.status === "完了" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>{r.status || "-"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-800 text-white font-semibold">
                <td colSpan={5} className="p-3 text-right">合计</td>
                <td className="p-3 text-right font-mono">¥{total.toLocaleString()}</td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          </table>
        )}
        <p className="text-xs text-gray-400 mt-4 text-right" suppressHydrationWarning>Kintone App 1046 · {new Date().toLocaleString("zh-CN")}</p>
      </div>
  );
}
