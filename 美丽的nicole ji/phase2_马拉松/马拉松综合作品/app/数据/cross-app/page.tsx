"use client";
import { useState } from "react";

interface CopyResult {
  copied: number;
  failed: number;
}

export default function CrossAppCopyPage() {
  const [srcApp, setSrcApp] = useState("");
  const [dstApp, setDstApp] = useState("");
  const [srcToken, setSrcToken] = useState("");
  const [dstToken, setDstToken] = useState("");
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CopyResult | null>(null);
  const [error, setError] = useState("");

  const handleCopy = async () => {
    if (!srcApp || !dstApp || !srcToken || !dstToken) {
      setError("请填写所有必填项");
      return;
    }
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ srcApp, dstApp, srcToken, dstToken, limit }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch {
      setError("复制失败，请检查配置");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Kintone 跨 App 复制</h1>
        <p className="text-sm text-gray-500 mb-6">将一个 Kintone App 的记录批量复制到另一个 App</p>

        <div className="space-y-5 mb-6">
          {/* 来源App */}
          <div className="p-4 bg-blue-50 rounded-xl space-y-3">
            <p className="text-sm font-bold text-blue-700">来源 App（读取）</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">App ID</label>
                <input
                  type="text" value={srcApp} onChange={e => setSrcApp(e.target.value)}
                  placeholder="1046"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">API Token</label>
                <input
                  type="password" value={srcToken} onChange={e => setSrcToken(e.target.value)}
                  placeholder="来源App的APIトークン"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>

          {/* 目标App */}
          <div className="p-4 bg-green-50 rounded-xl space-y-3">
            <p className="text-sm font-bold text-green-700">目标 App（写入）</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">App ID</label>
                <input
                  type="text" value={dstApp} onChange={e => setDstApp(e.target.value)}
                  placeholder="2000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">API Token</label>
                <input
                  type="password" value={dstToken} onChange={e => setDstToken(e.target.value)}
                  placeholder="目标App的APIトークン"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最大复制件数：<span className="text-blue-600 font-bold">{limit}</span>
            </label>
            <input
              type="range" min={1} max={500} value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <button
          onClick={handleCopy} disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-xl font-medium text-base"
        >
          {loading ? "复制中..." : `开始复制（最多 ${limit} 件）`}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        {result && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{result.copied}</p>
              <p className="text-sm text-green-400">复制成功</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{result.failed}</p>
              <p className="text-sm text-red-400">复制失败</p>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">
          ※ 目标 App 需具有与来源 App 相同的字段编码，且 API Token 需有写入权限
        </p>
      </div>
  );
}
