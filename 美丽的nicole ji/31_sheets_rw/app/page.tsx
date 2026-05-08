"use client";

import { useEffect, useState } from "react";

type Row = string[];

export default function Home() {
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function fetchData() {
    const res = await fetch("/api/sheets");
    const data = await res.json();
    setRows(data.rows ?? []);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !content) return;
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage("✅ 已成功写入 Google Sheets！");
      setName("");
      setContent("");
      fetchData();
    } else {
      setMessage("❌ 写入失败，请重试");
    }
    setLoading(false);
  }

  const header = rows[0] ?? [];
  const dataRows = rows.slice(1);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-800">
          📊 Google Sheets 读写应用
        </h1>

        {/* 提交表单 */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">写入数据</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入姓名"
                className="w-full border border-gray-400 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">内容</label>
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请输入内容"
                className="w-full border border-gray-400 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "写入中..." : "提交"}
            </button>
            {message && (
              <p className={`text-sm mt-2 font-medium ${message.startsWith("✅") ? "text-green-700" : "text-red-700"}`}>
                {message}
              </p>
            )}
          </form>
        </section>

        {/* 数据展示 */}
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Sheets 数据</h2>
          {rows.length <= 1 ? (
            <p className="text-gray-400 text-sm">暂无数据</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  {header.map((h, i) => (
                    <th key={i} className="text-left px-4 py-2 border border-gray-200 font-semibold text-gray-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-2 border border-gray-200 text-gray-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
