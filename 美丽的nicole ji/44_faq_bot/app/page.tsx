"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// 推荐问题
const SUGGESTED = [
  "年假怎么申请？",
  "费用报销的截止日期是什么时候？",
  "居家办公怎么申请？",
  "在哪里追踪AWB货物状态？",
  "加班申请怎么操作？",
  "密码忘了怎么办？",
];

function formatTime(date: Date) {
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // ---------- 发送消息 ----------
  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const userMessage: Message = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    // 先加一个空的 assistant 消息占位
    setMessages([...newMessages, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: "エラーが発生しました。再試行してください。" },
        ]);
        setStreaming(false);
        return;
      }

      // 流式读取并更新最后一条消息
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setMessages([
          ...newMessages,
          { role: "assistant", content: fullText },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "ネットワークエラーが発生しました。" },
      ]);
    }

    setStreaming(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setMessages([]);
  };

  // ============================================================
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              AI
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-800">社内 FAQ 助手</h1>
              <p className="text-xs text-green-500">在线</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg"
            >
              清空对话
            </button>
          )}
        </div>
      </header>

      {/* 对话区 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* 欢迎消息 */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-700 mb-1">
                欢迎使用社内FAQ助手
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                关于公司规则、流程、系统，随时提问
              </p>
              {/* 推荐问题 */}
              <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-left text-xs bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 消息气泡 */}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* AI 头像 */}
              {msg.role === "assistant" && (
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
                  AI
                </div>
              )}

              <div
                className={`max-w-sm rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white border border-gray-200 text-gray-700 rounded-tl-sm"
                }`}
              >
                {msg.content ? (
                  <p className="whitespace-pre-wrap">
                    {msg.content}
                    {streaming &&
                      idx === messages.length - 1 &&
                      msg.role === "assistant" && (
                        <span className="animate-pulse">▌</span>
                      )}
                  </p>
                ) : (
                  <span className="animate-pulse text-gray-400">入力中...</span>
                )}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* 输入区 */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="请输入问题..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={streaming}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 disabled:bg-gray-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={streaming || !input.trim()}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              发送
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            按 Enter 发送 · 信息不明时请联系相关部门确认
          </p>
        </div>
      </div>
    </div>
  );
}
