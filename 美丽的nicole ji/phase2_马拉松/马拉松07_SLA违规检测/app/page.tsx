"use client";
import { useState, useEffect } from "react";

interface SlaRecord {
  case_no: string;
  case_name: string;
  client: string;
  assignee: string;
  created_at: string;
  overdue_hours: number;
  status: string;
}

export default function Home() {
  const [slaHours, setSlaHours] = useState(24);
  const [records, setRecords] = useState<SlaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");

  const check = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/sla?hours=${slaHours}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else { setRecords(data.records ?? []); setChecked(true); }
    } catch {
      setError("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { check(); }, []);

  const fmtOverdue = (h: number) => {
    if (h < 24) return `${h} 小时`;
    const d = Math.floor(h / 24);
    const rem = h % 24;
    return rem > 0 ? `${d} 天 ${rem} 小时` : `${d} 天`;
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">SLA违规检测</h1>
        <p className="text-sm text-gray-500 mb-6">检测超过 SLA 响应时限的未完成案件</p>

        {/* 控制栏 */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <label className="text-sm text-gray-600">SLA 时限（小时）：</label>
          {[8, 12, 24, 48, 72].map(h => (
            <button
              key={h}
              onClick={() => setSlaHours(h)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${
                slaHours === h
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
              }`}
            >
              {h}h
            </button>
          ))}
          <button
            onClick={check} disabled={loading}
            className="ml-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2 rounded-lg text-sm font-medium"
          >
            {loading ? "检测中..." : "运行检测"}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {checked && !error && records.length === 0 && (
          <div className="text-center py-12 text-green-600 font-medium text-lg">
            ✓ 当前无 SLA 违规案件
          </div>
        )}

        {records.length > 0 && (
          <>
            <div className="flex gap-4 mb-4">
              <div className="bg-red-50 rounded-xl px-6 py-3 text-center">
                <p className="text-2xl font-bold text-red-600">{records.length}</p>
                <p className="text-xs text-red-400">违规案件数</p>
              </div>
              <div className="bg-orange-50 rounded-xl px-6 py-3 text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {Math.max(...records.map(r => r.overdue_hours))}h
                </p>
                <p className="text-xs text-orange-400">最长超时</p>
              </div>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="text-left p-3 border border-gray-200">案件番号</th>
                  <th className="text-left p-3 border border-gray-200">案件名</th>
                  <th className="text-left p-3 border border-gray-200">客户名</th>
                  <th className="text-left p-3 border border-gray-200">负责人</th>
                  <th className="text-center p-3 border border-gray-200">受付时间</th>
                  <th className="text-center p-3 border border-gray-200">超时时长</th>
                  <th className="text-center p-3 border border-gray-200">状态</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className="bg-red-50 hover:bg-red-100">
                    <td className="p-3 border border-gray-200 font-mono text-xs">{r.case_no || "-"}</td>
                    <td className="p-3 border border-gray-200">{r.case_name || "-"}</td>
                    <td className="p-3 border border-gray-200">{r.client || "-"}</td>
                    <td className="p-3 border border-gray-200">{r.assignee || "-"}</td>
                    <td className="p-3 border border-gray-200 text-center text-xs">{r.created_at || "-"}</td>
                    <td className="p-3 border border-gray-200 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        +{fmtOverdue(r.overdue_hours)}
                      </span>
                    </td>
                    <td className="p-3 border border-gray-200 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{r.status || "-"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <p className="text-xs text-gray-400 mt-6 text-right">
          数据来源：Kintone · 检测时间：{new Date().toLocaleString("zh-CN")}
        </p>
      </div>
    </main>
  );
}
