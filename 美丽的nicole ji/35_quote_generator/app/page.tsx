"use client";

import { useEffect, useState } from "react";

type Case = {
  id: string;
  client: string;
  case_name: string;
  amount: string;
  note: string;
};

export default function Home() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selected, setSelected] = useState<Case | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    fetch("/api/cases")
      .then((r) => r.json())
      .then((d) => {
        if (d.cases) setCases(d.cases);
        else setFetchError("读取案件失败");
      })
      .catch(() => setFetchError("读取案件失败"));
  }, []);

  async function handleGenerate() {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected),
      });
      if (!res.ok) throw new Error("生成失败");

      // HTML を新しいウィンドウで開いて印刷ダイアログを表示
      const html = await res.text();
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 800);
      }
    } catch (err) {
      console.error(err);
      alert("生成失败，请重试");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📄 报价单自动生成</h1>
          <p className="text-sm text-gray-500 mt-1">选择案件 → 一键生成 PDF 报价单</p>
        </div>

        {/* 案件列表 */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">选择案件</h2>
          {fetchError && <p className="text-red-600 text-sm">{fetchError}</p>}
          {cases.length === 0 && !fetchError && (
            <p className="text-gray-400 text-sm">加载中...</p>
          )}
          <div className="space-y-2">
            {cases.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                className={`border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                  selected?.id === c.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{c.client}</p>
                    <p className="text-sm text-gray-500">{c.case_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-700">
                      ¥{Number(c.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">ID: {c.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 选中案件的详情 */}
        {selected && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">报价单内容预览</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {[
                  ["客户名", selected.client],
                  ["案件名", selected.case_name],
                  ["金额", `¥${Number(selected.amount).toLocaleString()}`],
                  ["备注", selected.note],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="py-2 pr-4 font-medium text-gray-500 w-24">{label}</td>
                    <td className="py-2 text-gray-800">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-lg"
            >
              {loading ? "生成中..." : "⚡ 一键生成 PDF 报价单"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
