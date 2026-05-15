"use client";

import { useState } from "react";

// 分类结果类型
type ClassifyResult = {
  main_category: string;
  confidence: number;
  reason: string;
  categories: { name: string; score: number }[];
  urgency: string;
  sentiment: string;
};

// 每个类别的颜色配置
const CATEGORY_COLORS: Record<string, string> = {
  投诉: "bg-red-500",
  询价: "bg-blue-500",
  感谢反馈: "bg-green-500",
  紧急通知: "bg-orange-500",
  一般咨询: "bg-purple-500",
  文件申请: "bg-cyan-500",
};

const CATEGORY_BG: Record<string, string> = {
  投诉: "bg-red-100 text-red-700 border-red-200",
  询价: "bg-blue-100 text-blue-700 border-blue-200",
  感谢反馈: "bg-green-100 text-green-700 border-green-200",
  紧急通知: "bg-orange-100 text-orange-700 border-orange-200",
  一般咨询: "bg-purple-100 text-purple-700 border-purple-200",
  文件申请: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

// 示例文本
const EXAMPLES = [
  "你们的货物又延误了！这是第三次了，我们的客户非常不满，要求赔偿！",
  "请问从东京发到上海，100kg左右，大概需要多少运费？",
  "这次服务真的太棒了！货物提前到达，团队非常专业，下次还会合作！",
  "AWB货件紧急！货物在机场卡关，必须今天放行，请立即处理！",
  "想了解一下费用报销的申请流程和截止日期是什么时候？",
  "麻烦发一下上个月的运输发票和清关文件，谢谢。",
];

const URGENCY_STYLE: Record<string, string> = {
  高: "bg-red-100 text-red-700",
  中: "bg-yellow-100 text-yellow-700",
  低: "bg-green-100 text-green-700",
};

const SENTIMENT_STYLE: Record<string, string> = {
  正面: "bg-green-100 text-green-700",
  中性: "bg-gray-100 text-gray-600",
  负面: "bg-red-100 text-red-700",
};

// ============================================================
export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [error, setError] = useState("");

  // ---------- 分类 ----------
  const handleClassify = async (inputText?: string) => {
    const content = (inputText ?? text).trim();
    if (!content || loading) return;

    if (inputText) setText(inputText);

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });

      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "分类失败，请重试");
        return;
      }

      const data = (await res.json()) as ClassifyResult;
      setResult(data);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setResult(null);
    setError("");
  };

  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            AI
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-800">
              AI 数据分类工具
            </h1>
            <p className="text-xs text-gray-400">
              输入文本，自动分类 + 置信度评分
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* 输入区 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            输入文本（客户反馈 / 邮件主题 等）
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="例：你们的货物延误了三次，我们非常不满，要求赔偿！"
            rows={4}
            disabled={loading}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-400 disabled:bg-gray-50"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400">{text.length} / 2000</span>
            <div className="flex gap-2">
              {(text || result) && (
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg"
                >
                  清空
                </button>
              )}
              <button
                onClick={() => handleClassify()}
                disabled={loading || !text.trim()}
                className="bg-indigo-600 text-white px-6 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "分类中..." : "开始分类"}
              </button>
            </div>
          </div>
        </div>

        {/* 示例文本 */}
        {!result && !loading && (
          <div>
            <p className="text-xs text-gray-400 mb-2 font-medium">
              点击示例快速体验
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => handleClassify(ex)}
                  className="text-left text-xs bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">AI 分析中，请稍候...</p>
          </div>
        )}

        {/* 错误 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 分类结果 */}
        {result && !loading && (
          <div className="space-y-4">
            {/* 主结果卡片 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">
                分类结果
              </p>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* 主类别 */}
                <span
                  className={`text-base font-bold px-4 py-1.5 rounded-full border ${
                    CATEGORY_BG[result.main_category] ??
                    "bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  {result.main_category}
                </span>

                {/* 置信度 */}
                <span className="text-sm text-gray-500">
                  置信度{" "}
                  <span className="font-bold text-gray-800">
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </span>

                {/* 紧急度 */}
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    URGENCY_STYLE[result.urgency] ??
                    "bg-gray-100 text-gray-600"
                  }`}
                >
                  紧急度：{result.urgency}
                </span>

                {/* 情感 */}
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    SENTIMENT_STYLE[result.sentiment] ??
                    "bg-gray-100 text-gray-600"
                  }`}
                >
                  {result.sentiment}
                </span>
              </div>

              {/* 分类理由 */}
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">分类理由</p>
                <p className="text-sm text-gray-700">{result.reason}</p>
              </div>
            </div>

            {/* 置信度进度条 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-wide">
                各类别置信度
              </p>
              <div className="space-y-3">
                {result.categories
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((cat) => (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-medium ${
                            cat.name === result.main_category
                              ? "text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          {cat.name}
                          {cat.name === result.main_category && (
                            <span className="ml-1 text-indigo-500">★</span>
                          )}
                        </span>
                        <span
                          className={`text-xs font-bold tabular-nums ${
                            cat.name === result.main_category
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {(cat.score * 100).toFixed(1)}%
                        </span>
                      </div>
                      {/* 进度条 */}
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            CATEGORY_COLORS[cat.name] ?? "bg-gray-400"
                          }`}
                          style={{ width: `${(cat.score * 100).toFixed(1)}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 再次分类按钮 */}
            <div className="text-center">
              <button
                onClick={handleClear}
                className="text-sm text-indigo-600 hover:underline"
              >
                ← 重新输入
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
