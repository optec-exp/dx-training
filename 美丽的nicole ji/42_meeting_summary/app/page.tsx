"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---------- 类型定义 ----------
type Summary = {
  id: number;
  title: string;
  original_text: string;
  summary: string;
  action_items: string[];
  created_at: string;
};

// ---------- 解析 AI 输出 ----------
function parseResult(raw: string): { summary: string; actionItems: string[] } {
  const summaryMatch = raw.match(/【摘要】([\s\S]*?)(?=【行动项目】|$)/);
  const actionMatch = raw.match(/【行动项目】([\s\S]*?)$/);

  const summary = summaryMatch ? summaryMatch[1].trim() : raw.trim();
  const actionItems = actionMatch
    ? actionMatch[1]
        .split("\n")
        .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
        .filter((l) => l.length > 0)
    : [];

  return { summary, actionItems };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
export default function Home() {
  const [title, setTitle] = useState("");
  const [meetingText, setMeetingText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [rawOutput, setRawOutput] = useState("");
  const [saved, setSaved] = useState(false);
  const [histories, setHistories] = useState<Summary[]>([]);
  const [selected, setSelected] = useState<Summary | null>(null);
  const [message, setMessage] = useState("");

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // ---------- 获取历史 ----------
  const fetchHistories = async () => {
    const { data } = await supabase
      .from("meeting_summaries")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setHistories(data);
  };

  useEffect(() => {
    fetchHistories();
  }, []);

  // ---------- 生成摘要（流式） ----------
  const handleGenerate = async () => {
    if (!title.trim()) {
      showMsg("请填写会议标题");
      return;
    }
    if (!meetingText.trim()) {
      showMsg("请输入会议记录");
      return;
    }

    setStreaming(true);
    setRawOutput("");
    setSaved(false);
    setSelected(null);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: meetingText }),
      });

      if (!res.ok) {
        showMsg("生成失败，请稍后重试");
        setStreaming(false);
        return;
      }

      // 流式读取
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setRawOutput(fullText);
      }
    } catch {
      showMsg("网络错误，请重试");
    }

    setStreaming(false);
  };

  // ---------- 保存到 Supabase ----------
  const handleSave = async () => {
    if (!rawOutput) return;
    const { summary, actionItems } = parseResult(rawOutput);

    const { error } = await supabase.from("meeting_summaries").insert({
      title: title.trim(),
      original_text: meetingText.trim(),
      summary,
      action_items: actionItems,
    });

    if (error) {
      showMsg("保存失败：" + error.message);
    } else {
      showMsg("已保存到历史记录！");
      setSaved(true);
      fetchHistories();
    }
  };

  // ---------- 当前结果解析 ----------
  const { summary: parsedSummary, actionItems: parsedActions } =
    rawOutput ? parseResult(rawOutput) : { summary: "", actionItems: [] };

  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-bold text-gray-800">AI 会议纪要摘要工具</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            输入会议记录，自动生成摘要和行动项
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {message && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
            {message}
          </div>
        )}

        <div className="flex gap-6">
          {/* 左：输入 + 结果 */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* 输入区 */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-700 mb-3">会议记录输入</h2>
              <input
                type="text"
                placeholder="会议标题（例：5月12日 周例会）"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
              />
              <textarea
                placeholder={`在此粘贴会议记录文本...\n\n例：\n参加者：张三、李四、王五\n议题1：下季度销售目标\n　→ 目标定为100万，负责人张三，截止6月末\n议题2：新产品发布会策划\n　→ 王五负责场地预订，李四负责宣传材料，期限5月末`}
                value={meetingText}
                onChange={(e) => setMeetingText(e.target.value)}
                rows={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              />
              <button
                onClick={handleGenerate}
                disabled={streaming}
                className="mt-3 w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {streaming ? "AI 生成中..." : "✦ 生成摘要"}
              </button>
            </div>

            {/* 结果区（流式显示） */}
            {(streaming || rawOutput) && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-700">
                    生成结果
                    {streaming && (
                      <span className="ml-2 text-xs text-blue-500 animate-pulse">
                        生成中...
                      </span>
                    )}
                  </h2>
                  {!streaming && rawOutput && !saved && (
                    <button
                      onClick={handleSave}
                      className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs hover:bg-green-700"
                    >
                      保存到历史
                    </button>
                  )}
                  {saved && (
                    <span className="text-xs text-green-600">✓ 已保存</span>
                  )}
                </div>

                {/* 流式原始文本（生成中显示） */}
                {streaming && (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4">
                    {rawOutput}
                    <span className="animate-pulse">▌</span>
                  </div>
                )}

                {/* 解析后的结构化显示（生成完毕后显示） */}
                {!streaming && rawOutput && (
                  <div className="space-y-4">
                    {/* 摘要 */}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        摘要
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed bg-blue-50 rounded-lg p-4">
                        {parsedSummary}
                      </p>
                    </div>

                    {/* 行动项目 */}
                    {parsedActions.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          行动项目 ({parsedActions.length})
                        </h3>
                        <ul className="space-y-2">
                          {parsedActions.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-gray-700 bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-2.5"
                            >
                              <span className="text-yellow-500 font-bold mt-0.5">
                                {i + 1}
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 右：历史记录 */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-700 mb-3">
                历史记录 ({histories.length})
              </h2>
              {histories.length === 0 ? (
                <p className="text-xs text-gray-400">暂无历史记录</p>
              ) : (
                <div className="space-y-2">
                  {histories.map((h) => (
                    <div
                      key={h.id}
                      onClick={() =>
                        setSelected(selected?.id === h.id ? null : h)
                      }
                      className={`cursor-pointer rounded-lg p-3 border transition-colors ${
                        selected?.id === h.id
                          ? "border-blue-400 bg-blue-50"
                          : "border-gray-100 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {h.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(h.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 历史详情 */}
            {selected && (
              <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-700 mb-1">
                  {selected.title}
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  {formatDate(selected.created_at)}
                </p>

                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">摘要</p>
                  <p className="text-xs text-gray-700 leading-relaxed bg-blue-50 rounded p-2">
                    {selected.summary}
                  </p>
                </div>

                {selected.action_items?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      行动项目
                    </p>
                    <ul className="space-y-1">
                      {selected.action_items.map((item, i) => (
                        <li
                          key={i}
                          className="text-xs text-gray-700 bg-yellow-50 rounded px-2 py-1"
                        >
                          {i + 1}. {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
