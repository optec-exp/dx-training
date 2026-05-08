"use client";

import { useEffect, useState } from "react";
import JSZip from "jszip";

type Client = {
  id: string;
  client: string;
  case_name: string;
  amount: string;
  note: string;
};

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => {
        if (d.clients) {
          setClients(d.clients);
          setSelected(new Set(d.clients.map((c: Client) => c.id)));
        }
      });
  }, []);

  function toggleAll() {
    if (selected.size === clients.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(clients.map((c) => c.id)));
    }
  }

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function handleGenerate() {
    const targets = clients.filter((c) => selected.has(c.id));
    if (targets.length === 0) return;

    setGenerating(true);
    setDone(false);
    setProgress(0);
    setTotal(targets.length);

    const zip = new JSZip();

    for (let i = 0; i < targets.length; i++) {
      const c = targets[i];
      const res = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...c, month }),
      });
      const html = await res.text();
      zip.file(`发票_${c.client}_${month}.html`, html);
      setProgress(i + 1);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `发票_${month}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    setGenerating(false);
    setDone(true);
  }

  const percent = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🧾 发票批量生成</h1>
          <p className="text-sm text-gray-500 mt-1">选择月份和客户 → 批量生成 HTML 发票 → ZIP 下载</p>
        </div>

        {/* 月份选择 */}
        <div className="bg-white rounded-xl shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">开票月份</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* 客户列表 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">选择客户</h2>
            <button onClick={toggleAll} className="text-sm text-blue-600 hover:underline">
              {selected.size === clients.length ? "取消全选" : "全选"}
            </button>
          </div>
          <div className="space-y-2">
            {clients.map((c) => (
              <label key={c.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="w-4 h-4 accent-blue-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{c.client}</p>
                  <p className="text-sm text-gray-500">{c.case_name}</p>
                </div>
                <p className="font-semibold text-gray-700">¥{Number(c.amount).toLocaleString()}</p>
              </label>
            ))}
          </div>
        </div>

        {/* 进度条 */}
        {generating && (
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-600 mb-2">生成中... {progress} / {total}</p>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-right text-sm text-gray-500 mt-1">{percent}%</p>
          </div>
        )}

        {done && (
          <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-green-700 font-medium">
            ✅ 全部生成完成！ZIP 文件已下载。打开 HTML 文件后可打印为 PDF。
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating || selected.size === 0}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-lg"
        >
          {generating ? `生成中 ${progress}/${total}...` : `⚡ 批量生成 ${selected.size} 份发票`}
        </button>
      </div>
    </main>
  );
}
