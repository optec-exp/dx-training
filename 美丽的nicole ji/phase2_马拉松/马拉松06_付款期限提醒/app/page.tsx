"use client";
import { useState, useEffect } from "react";

interface PaymentRecord {
  case_no: string;
  case_name: string;
  client: string;
  payment_date: string;
  amount: string;
  days_left: number;
}

export default function Home() {
  const [threshold, setThreshold] = useState(7);
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");

  const check = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/alert?days=${threshold}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else setRecords(data.records ?? []);
      setChecked(true);
    } catch {
      setError("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { check(); }, []);

  const getBadge = (days: number) => {
    if (days < 0)
      return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">逾期 {Math.abs(days)} 天</span>;
    if (days === 0)
      return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">今天到期</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">剩余 {days} 天</span>;
  };

  const rowBg = (days: number) => {
    if (days < 0) return "bg-red-50";
    if (days <= 3) return "bg-orange-50";
    return "bg-yellow-50";
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">付款期限提醒</h1>
        <p className="text-sm text-gray-500 mb-6">显示即将到期或已逾期的付款案件</p>

        {/* 控制栏 */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <label className="text-sm text-gray-600">提前提醒天数：</label>
          <input
            type="range" min={1} max={30} value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            className="w-36"
          />
          <span className="text-blue-600 font-bold w-10">{threshold} 天</span>
          <button
            onClick={check} disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2 rounded-lg text-sm font-medium"
          >
            {loading ? "检查中..." : "立即检查"}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {checked && !error && records.length === 0 && (
          <div className="text-center py-12 text-green-600 font-medium text-lg">
            ✓ 暂无即将到期的付款案件
          </div>
        )}

        {records.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              {threshold} 天内到期或已逾期：共{" "}
              <span className="font-bold text-red-600">{records.length}</span> 件
            </p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="text-left p-3 border border-gray-200">案件番号</th>
                  <th className="text-left p-3 border border-gray-200">案件名</th>
                  <th className="text-left p-3 border border-gray-200">客户名</th>
                  <th className="text-right p-3 border border-gray-200">金额</th>
                  <th className="text-center p-3 border border-gray-200">付款日</th>
                  <th className="text-center p-3 border border-gray-200">状态</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className={rowBg(r.days_left)}>
                    <td className="p-3 border border-gray-200 font-mono text-xs">{r.case_no || "-"}</td>
                    <td className="p-3 border border-gray-200">{r.case_name || "-"}</td>
                    <td className="p-3 border border-gray-200">{r.client || "-"}</td>
                    <td className="p-3 border border-gray-200 text-right">
                      ¥{Number(r.amount || 0).toLocaleString()}
                    </td>
                    <td className="p-3 border border-gray-200 text-center">{r.payment_date || "-"}</td>
                    <td className="p-3 border border-gray-200 text-center">{getBadge(r.days_left)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <p className="text-xs text-gray-400 mt-6 text-right">
          数据来源：Kintone App {process.env.NEXT_PUBLIC_APP_ID || ""} · 检查时间：{new Date().toLocaleString("zh-CN")}
        </p>
      </div>
    </main>
  );
}
