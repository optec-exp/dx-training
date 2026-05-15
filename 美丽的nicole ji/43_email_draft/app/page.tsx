"use client";

import { useState } from "react";

// ---------- 解析三语版本 ----------
function parseEmails(raw: string) {
  const ja = raw.match(/===日本語===([\s\S]*?)(?====ENGLISH===|$)/)?.[1]?.trim() ?? "";
  const en = raw.match(/===ENGLISH===([\s\S]*?)(?====中文===|$)/)?.[1]?.trim() ?? "";
  const zh = raw.match(/===中文===([\s\S]*?)$/)?.[1]?.trim() ?? "";
  return { ja, en, zh };
}

// ---------- 复制按钮 ----------
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
        copied
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {copied ? "✓ 已复制" : "复制"}
    </button>
  );
}

// ---------- 邮件卡片 ----------
function EmailCard({
  lang,
  flag,
  content,
  streaming,
}: {
  lang: string;
  flag: string;
  content: string;
  streaming: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{flag}</span>
          <h3 className="font-semibold text-gray-700">{lang}</h3>
          {streaming && !content && (
            <span className="text-xs text-blue-400 animate-pulse">生成中...</span>
          )}
        </div>
        {content && <CopyButton text={content} />}
      </div>
      {content ? (
        <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
          {content}
          {streaming && <span className="animate-pulse">▌</span>}
        </pre>
      ) : (
        <div className="h-32 flex items-center justify-center text-gray-300 text-sm">
          {streaming ? (
            <span className="animate-pulse">等待生成...</span>
          ) : (
            "尚未生成"
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
export default function Home() {
  const [points, setPoints] = useState("");
  const [tone, setTone] = useState("formal");
  const [recipient, setRecipient] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [rawOutput, setRawOutput] = useState("");
  const [message, setMessage] = useState("");

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // ---------- 生成邮件 ----------
  const handleGenerate = async () => {
    if (!points.trim()) {
      showMsg("请输入邮件要点");
      return;
    }

    setStreaming(true);
    setRawOutput("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points, tone, recipient }),
      });

      if (!res.ok) {
        showMsg("生成失败，请稍后重试");
        setStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setRawOutput(fullText);
      }
    } catch {
      showMsg("网络错误，请重试");
    }

    setStreaming(false);
  };

  const { ja, en, zh } = parseEmails(rawOutput);

  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-bold text-gray-800">AI 邮件草稿助手</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            输入要点，自动生成日语 / 英语 / 中文三版商务邮件
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {message && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
            {message}
          </div>
        )}

        {/* 输入区 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">邮件要点输入</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* 语气 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">语气</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTone("formal")}
                  className={`flex-1 py-2 rounded-lg text-sm ${
                    tone === "formal"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  正式
                </button>
                <button
                  onClick={() => setTone("polite")}
                  className={`flex-1 py-2 rounded-lg text-sm ${
                    tone === "polite"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  礼貌友善
                </button>
              </div>
            </div>

            {/* 收件人 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">收件人类型</label>
              <input
                type="text"
                placeholder="例：客户、合作方、上司..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* 要点输入 */}
          <textarea
            placeholder={`输入邮件要点，例如：\n・询问项目进度\n・原定5月20日的会议希望改到5月22日\n・请对方确认新的日程是否方便`}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            rows={5}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none mb-3"
          />

          <button
            onClick={handleGenerate}
            disabled={streaming}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {streaming ? "✦ 生成中..." : "✦ 生成三语邮件"}
          </button>
        </div>

        {/* 三语输出区 */}
        {(streaming || rawOutput) && (
          <div className="grid grid-cols-3 gap-4">
            <EmailCard
              lang="日本語"
              flag="🇯🇵"
              content={ja}
              streaming={streaming}
            />
            <EmailCard
              lang="English"
              flag="🇺🇸"
              content={en}
              streaming={streaming}
            />
            <EmailCard
              lang="中文"
              flag="🇨🇳"
              content={zh}
              streaming={streaming}
            />
          </div>
        )}
      </div>
    </div>
  );
}
