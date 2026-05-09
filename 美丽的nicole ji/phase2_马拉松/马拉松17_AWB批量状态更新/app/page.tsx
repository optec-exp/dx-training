"use client";
import { useState } from "react";

const STATUS_OPTIONS = [
  "受付中",
  "集荷済み",
  "輸送中",
  "通関中",
  "配達中",
  "配達完了",
  "保留",
  "キャンセル",
];

interface UpdateResult {
  updated: number;
  not_found: number;
  failed: number;
  details: { awb: string; status: "updated" | "not_found" | "failed" }[];
}

export default function Home() {
  const [awbInput, setAwbInput] = useState("");
  const [newStatus, setNewStatus] = useState(STATUS_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UpdateResult | null>(null);
  const [error, setError] = useState("");

  const awbList = awbInput
    .split(/[\n,，\s]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const handleUpdate = async () => {
    if (awbList.length === 0) { setError("请输入 AWB 番号"); return; }
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awb_list: awbList, new_status: newStatus }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch {
      setError("更新失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">AWB 批量状态更新</h1>
        <p className="text-sm text-gray-500 mb-6">输入多个 AWB 番号，一键批量更新状态到 Kintone</p>

        {/* AWB输入 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AWB 番号列表
            {awbList.length > 0 && (
              <span className="ml-2 text-blue-600 font-bold">（{awbList.length} 件）</span>
            )}
          </label>
          <textarea
            value={awbInput}
            onChange={e => setAwbInput(e.target.value)}
            placeholder={"每行一个，或用逗号分隔：\nJL123456789\nJL987654321\nJL555444333"}
            rows={6}
            className="w-full border border-gray-300 rounded-xl p-4 text-sm font-mono text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* 状态选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">更新为状态</label>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setNewStatus(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                  newStatus === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleUpdate} disabled={loading || awbList.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-xl font-medium text-base"
        >
          {loading ? "更新中..." : `批量更新 ${awbList.length} 件 → 「${newStatus}」`}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{result.updated}</p>
                <p className="text-sm text-green-400">更新成功</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-yellow-600">{result.not_found}</p>
                <p className="text-sm text-yellow-400">未找到</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-red-600">{result.failed}</p>
                <p className="text-sm text-red-400">更新失败</p>
              </div>
            </div>

            {/* 详细结果 */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600">
                    <th className="text-left p-2 border border-gray-200">AWB 番号</th>
                    <th className="text-center p-2 border border-gray-200">结果</th>
                  </tr>
                </thead>
                <tbody>
                  {result.details.map((d, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="p-2 border border-gray-200 font-mono">{d.awb}</td>
                      <td className="p-2 border border-gray-200 text-center">
                        {d.status === "updated" && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">✓ 已更新</span>
                        )}
                        {d.status === "not_found" && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">未找到</span>
                        )}
                        {d.status === "failed" && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">失败</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
