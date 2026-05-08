"use client";
import { useState } from "react";

interface Result {
  case_no: string;
  folder_url: string | null;
}

export default function Home() {
  const [form, setForm] = useState({
    case_name: "",
    client: "",
    assignee: "",
    amount: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/create-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "未知错误");
      setResult(data);
      setForm({ case_name: "", client: "", assignee: "", amount: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">接单登录</h1>
        <p className="text-sm text-gray-500 mb-6">
          填写后将自动：保存至 Kintone → 创建 Drive 文件夹 → Slack 通知负责人
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              案件名 <span className="text-red-500">*</span>
            </label>
            <input
              name="case_name"
              value={form.case_name}
              onChange={handleChange}
              required
              placeholder="例：Samsung 手机零件运输"
              className="w-full border border-gray-400 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              客户名 <span className="text-red-500">*</span>
            </label>
            <input
              name="client"
              value={form.client}
              onChange={handleChange}
              required
              placeholder="例：Samsung Electronics"
              className="w-full border border-gray-400 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              负责人 <span className="text-red-500">*</span>
            </label>
            <input
              name="assignee"
              value={form.assignee}
              onChange={handleChange}
              required
              placeholder="例：Nicole Ji"
              className="w-full border border-gray-400 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              金额（元） <span className="text-red-500">*</span>
            </label>
            <input
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleChange}
              required
              min={0}
              placeholder="例：50000"
              className="w-full border border-gray-400 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? "处理中..." : "提交接单"}
          </button>
        </form>

        {/* 错误提示 */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            错误：{error}
          </div>
        )}

        {/* 成功结果 */}
        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
            <p className="text-green-800 font-semibold text-sm">接单成功！</p>
            <p className="text-sm text-gray-700">
              案件番号：<span className="font-mono font-bold">{result.case_no}</span>
            </p>
            {result.folder_url && (
              <a
                href={result.folder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-blue-600 hover:underline"
              >
                打开 Drive 文件夹
              </a>
            )}
            <p className="text-xs text-gray-500">
              Kintone 已保存 / Slack 已通知负责人
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
