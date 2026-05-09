"use client";
import { useState, useEffect } from "react";

interface StaleRecord {
  case_no: string;
  case_name: string;
  client: string;
  assignee: string;
  last_updated: string;
  stale_days: number;
  status: string;
}

export default function Home() {
  const [threshold, setThreshold] = useState(3);
  const [records, setRecords] = useState<StaleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");

  const check = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/followup?days=${threshold}`);
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

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">案件未跟进提醒</h1>
        <p className="text-sm text-gray-500 mb-6">显示超过指定天数未更新的进行中案件</p>

        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <label className="text-sm text-gray-600">未跟进超过：</label>
          {[1, 2, 3, 5, 7, 14].map(d => (
            <button
              key={d}
              onClick={() => setThreshold(d)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${
                threshold === d
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-600 border-gray-300 hover:border-orange-400"
              }`}
            >
              {d} 天
            </button>
          ))}
          <button
            onClick={check} disabled={loading}
            className="ml-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-5 py-2 rounded-lg text-sm font-medium"
          >
            {loading ? "检查中..." : "立即检查"}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {checked && !error && records.length === 0 && (
          <div className="text-center py-12 text-green-600 font-medium text-lg">
            ✓ 所有案件均在 {threshold} 天内有跟进记录
          </div>
        )}

        {records.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              超过 <span className="font-bold text-orange-600">{threshold}</span> 天未跟进：共{" "}
              <span className="font-bold text-orange-600">{records.length}</span> 件
            </p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="text-left p-3 border border-gray-200">案件番号</th>
                  <th className="text-left p-3 border border-gray-200">案件名</th>
                  <th className="text-left p-3 border border-gray-200">客户名</th>
                  <th className="text-left p-3 border border-gray-200">负责人</th>
                  <th className="text-center p-3 border border-gray-200">最后更新</th>
                  <th className="text-center p-3 border border-gray-200">停滞天数</th>
                  <th className="text-center p-3 border border-gray-200">状态</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className={r.stale_days >= 7 ? "bg-red-50" : "bg-orange-50"}>
                    <td className="p-3 border border-gray-200 font-mono text-xs">{r.case_no || "-"}</td>
                    <td className="p-3 border border-gray-200">{r.case_name || "-"}</td>
                    <td className="p-3 border border-gray-200">{r.client || "-"}</td>
                    <td className="p-3 border border-gray-200">{r.assignee || "-"}</td>
                    <td className="p-3 border border-gray-200 text-center text-xs">{r.last_updated || "-"}</td>
                    <td className="p-3 border border-gray-200 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        r.stale_days >= 7 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        {r.stale_days} 天
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
          数据来源：Kintone · 检查时间：{new Date().toLocaleString("zh-CN")}
        </p>
      </div>
    </main>
  );
}
