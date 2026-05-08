"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";

type CsvRow = { id: string; Name: string; Email: string; content: string };
type Result = { success: number; failure: number; errors: string[] };

export default function Home() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setParseError("");

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        const data = parsed.data;
        // 必須列チェック
        const required = ["id", "Name", "Email", "content"];
        const headers = Object.keys(data[0] ?? {});
        const missing = required.filter((k) => !headers.includes(k));
        if (missing.length > 0) {
          setParseError(`CSV に必要な列がありません: ${missing.join(", ")}`);
          setRows([]);
          return;
        }
        setRows(data);
      },
      error: () => setParseError("CSV の解析に失敗しました"),
    });
  }

  async function handleUpdate() {
    if (rows.length === 0) return;
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/bulk-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: rows }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  function handleReset() {
    setRows([]);
    setResult(null);
    setParseError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📂 Kintone 批量更新工具</h1>
          <p className="text-sm text-gray-500 mt-1">上传 CSV 文件，批量更新 Kintone 记录</p>
        </div>

        {/* CSV 格式说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">CSV 格式要求（第一行为标题）：</p>
          <code className="block bg-white rounded p-2 text-xs text-gray-700 mt-1">
            id,Name,Email,content<br />
            1,Nicole,nicole@test.com,更新内容1<br />
            2,Stella,stella@test.com,更新内容2
          </code>
        </div>

        {/* 文件上传 */}
        <div className="bg-white rounded-xl shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">选择 CSV 文件</label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          />
          {parseError && <p className="mt-2 text-sm text-red-600">{parseError}</p>}
        </div>

        {/* 预览 */}
        {rows.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              预览（共 {rows.length} 条记录）
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    {["id", "Name", "Email", "content"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 border border-gray-200 font-semibold text-gray-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 border border-gray-200 text-gray-700">{row.id}</td>
                      <td className="px-3 py-2 border border-gray-200 text-gray-700">{row.Name}</td>
                      <td className="px-3 py-2 border border-gray-200 text-gray-700">{row.Email}</td>
                      <td className="px-3 py-2 border border-gray-200 text-gray-700">{row.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {loading ? "更新中..." : `确认更新 ${rows.length} 条记录`}
              </button>
              <button
                onClick={handleReset}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium"
              >
                重置
              </button>
            </div>
          </div>
        )}

        {/* 结果 */}
        {result && (
          <div className={`rounded-xl shadow p-6 ${result.failure === 0 ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
            <h2 className="text-lg font-semibold mb-3">更新结果</h2>
            <div className="flex gap-6 text-lg font-bold">
              <span className="text-green-700">✅ 成功：{result.success} 件</span>
              <span className="text-red-600">❌ 失败：{result.failure} 件</span>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-3 text-sm text-red-700">
                {result.errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
