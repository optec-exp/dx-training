"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<{ name?: string; email?: string; content?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "姓名为必填项";
    if (!email.trim()) e.email = "邮箱为必填项";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "邮箱格式不正确";
    if (!content.trim()) e.content = "内容为必填项";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus("loading");

    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, content }),
    });
    const data = await res.json();

    if (data.success) {
      setStatus("success");
      setName("");
      setEmail("");
      setContent("");
    } else {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">问询表单</h1>
        <p className="text-sm text-gray-500 mb-6">
          提交后数据保存到 Kintone，同时发送 Slack 通知
        </p>

        {status === "success" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg text-green-700 font-medium">
            ✅ 提交成功！数据已保存，Slack 通知已发送。
          </div>
        )}
        {status === "error" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700 font-medium">
            ❌ 提交失败，请稍后重试。
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入姓名"
              className={`w-full border rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 ${
                errors.name ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              className={`w-full border rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 ${
                errors.email ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入问询内容"
              rows={4}
              className={`w-full border rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none ${
                errors.content ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content}</p>}
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {status === "loading" ? "提交中..." : "提交 → Kintone & Slack"}
          </button>
        </form>
      </div>
    </main>
  );
}
