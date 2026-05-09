"use client";
import { useState, useEffect } from "react";

interface RateRecord {
  record_id: string;
  currency: string;
  rate: number;
  date: string;
  deviation_pct: number;
  is_anomaly: boolean;
}

interface Summary {
  currency: string;
  avg: number;
  min: number;
  max: number;
  anomaly_count: number;
}

export default function Home() {
  const [threshold, setThreshold] = useState(5);
  const [records, setRecords] = useState<RateRecord[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const check = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/rate?threshold=${threshold}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else { setRecords(data.records ?? []); setSummaries(data.summaries ?? []); }
    } catch {
      setError("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { check(); }, []);

  const anomalies = records.filter(r => r.is_anomaly);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">汇率异常警报</h1>
        <p className="text-sm text-gray-500 mb-6">检测偏离均值超过阈值的汇率记录</p>

        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <label className="text-sm text-gray-600">异常阈值：</label>
          {[2, 3, 5, 8, 10].map(t => (
            <button
              key={t}
              onClick={() => setThreshold(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${
                threshold === t
                  ? "bg-yellow-500 text-white border-yellow-500"
                  : "bg-white text-gray-600 border-gray-300 hover:border-yellow-400"
              }`}
            >
              ±{t}%
            </button>
          ))}
          <button
            onClick={check} disabled={loading}
            className="ml-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white px-5 py-2 rounded-lg text-sm font-medium"
          >
            {loading ? "检测中..." : "运行检测"}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* 汇总卡片 */}
        {summaries.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {summaries.map((s, i) => (
              <div key={i} className={`rounded-xl p-4 border ${s.anomaly_count > 0 ? "border-yellow-300 bg-yellow-50" : "border-gray-200 bg-gray-50"}`}>
                <p className="font-bold text-gray-700">{s.currency}</p>
                <p className="text-lg font-bold text-gray-900">{s.avg.toFixed(4)}</p>
                <p className="text-xs text-gray-400">均值 · {s.min.toFixed(4)} ～ {s.max.toFixed(4)}</p>
                {s.anomaly_count > 0 && (
                  <p className="text-xs font-bold text-yellow-600 mt-1">⚠ {s.anomaly_count} 条异常</p>
                )}
              </div>
            ))}
          </div>
        )}

        {anomalies.length === 0 && !loading && records.length > 0 && (
          <div className="text-center py-8 text-green-600 font-medium">✓ 当前无汇率异常记录</div>
        )}

        {anomalies.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              异常记录（偏差 &gt; <span className="font-bold text-yellow-600">±{threshold}%</span>）：共{" "}
              <span className="font-bold text-yellow-600">{anomalies.length}</span> 条
            </p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="text-left p-3 border border-gray-200">货币</th>
                  <th className="text-right p-3 border border-gray-200">汇率</th>
                  <th className="text-center p-3 border border-gray-200">日期</th>
                  <th className="text-right p-3 border border-gray-200">偏差</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((r, i) => (
                  <tr key={i} className="bg-yellow-50">
                    <td className="p-3 border border-gray-200 font-bold">{r.currency}</td>
                    <td className="p-3 border border-gray-200 text-right font-mono">{r.rate.toFixed(4)}</td>
                    <td className="p-3 border border-gray-200 text-center text-xs">{r.date}</td>
                    <td className="p-3 border border-gray-200 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        Math.abs(r.deviation_pct) > threshold * 2
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {r.deviation_pct > 0 ? "+" : ""}{r.deviation_pct.toFixed(2)}%
                      </span>
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
