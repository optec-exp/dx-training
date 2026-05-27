"use client";

import { useState } from "react";

export default function Home() {
  // 六个 state：
  const [points, setPoints] = useState("");         // 用户输入的邮件要点
  const [result, setResult] = useState("");         // AI 返回的原始字符串（fallback 用）
  const [parsed, setParsed] = useState(null);      // 解析后的 { ja, en, zh } 对象
  const [loading, setLoading] = useState(false);   // 是否正在加载
  const [error, setError] = useState("");           // 错误信息（出错时显示红色错误块）
  const [copiedCode, setCopiedCode] = useState(""); // 刚刚复制的栏的 code（用于显示"✓ 已复制"）

  // 复制某一栏的完整邮件内容到剪贴板
  async function handleCopy(code, subject, body) {
    const fullText = `${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedCode(code);
      // 2 秒后恢复
      setTimeout(() => setCopiedCode(""), 2000);
    } catch (err) {
      console.error("复制失败：", err);
      alert("复制失败，请手动选中文本复制");
    }
  }

  // 点击"生成"按钮时执行
  async function handleGenerate() {
    setLoading(true);
    setResult("");
    setParsed(null);
    setError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      });

      // HTTP 状态码非 2xx → 后端报错
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "生成失败，请稍后重试");
        return;
      }

      const data = await response.json();
      const rawText = data.result || "";
      setResult(rawText);

      // 尝试把 AI 返回的字符串解析成 JSON 对象
      try {
        const obj = JSON.parse(rawText);
        if (obj && obj.ja && obj.en && obj.zh) {
          setParsed(obj);
        }
      } catch (e) {
        // 解析失败就不设 parsed，下面会降级显示原始文本
        console.warn("JSON 解析失败，降级显示原始文本", e);
      }
    } catch (err) {
      // fetch 本身抛错 = 网络问题
      console.error("网络异常：", err);
      setError("网络异常，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  }

  // 三栏配置，避免重复写
  const columns = parsed
    ? [
        { code: "JP", label: "日本語", data: parsed.ja, badgeColor: "bg-rose-100 text-rose-800" },
        { code: "GB", label: "English", data: parsed.en, badgeColor: "bg-blue-100 text-blue-800" },
        { code: "CN", label: "中文", data: parsed.zh, badgeColor: "bg-amber-100 text-amber-800" },
      ]
    : [];

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">AI 邮件草稿助手</h1>
      <p className="text-gray-600 mb-6">输入要点，自动生成日 / 英 / 中三语商务邮件草稿。</p>

      <label className="block mb-2 font-medium">邮件要点：</label>
      <textarea
        value={points}
        onChange={(e) => setPoints(e.target.value)}
        placeholder="例如：通知客户项目延期一周"
        rows={5}
        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* 输入提示 */}
      <div className="mt-1 mb-4 text-sm h-5">
        {points.trim().length === 0 && (
          <span className="text-gray-500">请输入邮件要点（建议 10 字以上效果更佳）</span>
        )}
        {points.trim().length > 0 && points.trim().length < 10 && (
          <span className="text-orange-600">⚠ 内容太短，可能影响生成质量</span>
        )}
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || points.trim().length === 0}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "生成中..." : "生成"}
      </button>

      {/* 加载中的骨架屏 */}
      {loading && (
        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-3 animate-pulse">等待生成中，通常 3~10 秒…</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 animate-pulse"
              >
                <div className="h-5 w-20 bg-gray-200 rounded mb-4" />
                <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
                <div className="h-5 w-full bg-gray-200 rounded mb-4" />
                <div className="border-t border-gray-200 my-3" />
                <div className="h-3 w-12 bg-gray-200 rounded mb-2" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 rounded" />
                  <div className="h-3 w-5/6 bg-gray-200 rounded" />
                  <div className="h-3 w-4/6 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 错误块 */}
      {!loading && error && (
        <div className="mt-8 border border-red-300 bg-red-50 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-red-600 text-xl mr-3">⚠</span>
            <div className="flex-1">
              <div className="font-medium text-red-800">{error}</div>
              <div className="text-sm text-red-600 mt-1">
                如多次失败，请检查网络或稍后再试。
              </div>
            </div>
            <button
              onClick={handleGenerate}
              className="ml-3 px-4 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {!loading && !error && result && (
        <div className="mt-8">
          {parsed ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {columns.map((col) => (
                <div
                  key={col.code}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col"
                >
                  {/* 顶部：语言徽章 + 复制按钮 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${col.badgeColor}`}>
                        {col.code}
                      </span>
                      <span className="ml-2 text-gray-700 font-medium">{col.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(col.code, col.data.subject, col.data.body)}
                      className={`text-xs px-3 py-1 border rounded transition-colors ${
                        copiedCode === col.code
                          ? "border-green-500 text-green-700 bg-green-50"
                          : "border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {copiedCode === col.code ? "✓ 已复制" : "复制"}
                    </button>
                  </div>

                  {/* Subject 区 */}
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 uppercase mb-1">Subject</div>
                    <div className="font-bold text-gray-900">{col.data.subject}</div>
                  </div>

                  {/* 分隔线 */}
                  <div className="border-t border-gray-200 my-3" />

                  {/* Body 区（保留换行）*/}
                  <div>
                    <div className="text-xs text-gray-500 uppercase mb-1">Body</div>
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">
                      {col.data.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="text-sm text-orange-700 mb-2">⚠ JSON 解析失败，显示原始内容</p>
              <div className="p-4 border border-gray-200 rounded bg-gray-50 whitespace-pre-wrap">
                {result}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
