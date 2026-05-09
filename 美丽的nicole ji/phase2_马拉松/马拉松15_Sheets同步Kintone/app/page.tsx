"use client";
import { useState } from "react";

interface SyncResult {
  synced: number;
  failed: number;
  timestamp: string;
}

export default function Home() {
  const [sheetId, setSheetId] = useState("");
  const [sheetName, setSheetName] = useState("Sheet1");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState("");

  const sync = async () => {
    if (!sheetId || !apiKey) {
      setError("请填写 Sheets ID 和 Google API Key");
      return;
    }
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, sheetName, apiKey }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch {
      setError("同步失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Google Sheets 同步 Kintone</h1>
        <p className="text-sm text-gray-500 mb-6">从 Google Sheets 读取数据并批量写入 Kintone</p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Sheets ID</label>
            <input
              type="text" value={sheetId} onChange={e => setSheetId(e.target.value)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">URL 中 /spreadsheets/d/ 之后的部分</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">シート名</label>
            <input
              type="text" value={sheetName} onChange={e => setSheetName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google API Key（需开启 Sheets API）
            </label>
            <input
              type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">※ Sheets 需设为「共享给知道链接的人」（仅查看）</p>
          </div>
        </div>

        <button
          onClick={sync} disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-xl font-medium text-base"
        >
          {loading ? "同步中..." : "开始同步 Sheets → Kintone"}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        {result && (
          <div className="mt-6 p-6 bg-blue-50 rounded-xl">
            <p className="text-blue-700 font-bold text-lg mb-3">✓ 同步完成</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{result.synced}</p>
                <p className="text-sm text-green-400">写入成功</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-red-600">{result.failed}</p>
                <p className="text-sm text-red-400">写入失败</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">同步时间：{result.timestamp}</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-600">Kintone 环境变量（.env.local）：</p>
          <p>KINTONE_SUBDOMAIN=your-subdomain</p>
          <p>KINTONE_API_TOKEN=your-token</p>
          <p>KINTONE_APP_ID=your-app-id</p>
          <p className="mt-1 text-gray-400">※ Sheets 第一行需与 Kintone 字段编码一致</p>
        </div>
      </div>
    </main>
  );
}
