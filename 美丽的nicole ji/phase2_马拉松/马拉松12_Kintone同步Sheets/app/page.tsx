"use client";
import { useState } from "react";

interface SyncResult {
  synced_rows: number;
  sheet_url: string;
  timestamp: string;
}

export default function Home() {
  const [sheetId, setSheetId] = useState(process.env.NEXT_PUBLIC_SHEET_ID ?? "");
  const [sheetName, setSheetName] = useState("Sheet1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState("");

  const sync = async () => {
    if (!sheetId) { setError("请输入 Google Sheets ID"); return; }
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, sheetName }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch {
      setError("同步失败，请检查配置");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Kintone 同步 Google Sheets</h1>
        <p className="text-sm text-gray-500 mb-6">将 Kintone 数据导出并写入指定的 Google Sheets</p>

        {/* 配置区 */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Sheets ID
            </label>
            <input
              type="text"
              value={sheetId}
              onChange={e => setSheetId(e.target.value)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              从 Sheets URL 中提取：.../spreadsheets/d/<span className="text-blue-500">ここがID</span>/edit
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">シート名</label>
            <input
              type="text"
              value={sheetName}
              onChange={e => setSheetName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={sync} disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-3 rounded-xl font-medium text-base"
        >
          {loading ? "同步中..." : "开始同步 Kintone → Sheets"}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        {result && (
          <div className="mt-6 p-6 bg-green-50 rounded-xl">
            <p className="text-green-700 font-bold text-lg mb-3">✓ 同步完成</p>
            <div className="space-y-2 text-sm text-gray-700">
              <p>写入行数：<span className="font-bold text-green-700">{result.synced_rows} 行</span></p>
              <p>同步时间：{result.timestamp}</p>
              {result.sheet_url && (
                <a
                  href={result.sheet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-blue-600 hover:underline"
                >
                  在 Google Sheets 中查看 →
                </a>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-600">环境变量配置（.env.local）：</p>
          <p>KINTONE_SUBDOMAIN=your-subdomain</p>
          <p>KINTONE_API_TOKEN=your-token</p>
          <p>KINTONE_APP_ID=your-app-id</p>
          <p>GOOGLE_SERVICE_ACCOUNT_JSON={`{"type":"service_account",...}`}</p>
        </div>
      </div>
    </main>
  );
}
