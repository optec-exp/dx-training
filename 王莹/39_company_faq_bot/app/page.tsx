"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user", content: text } as Msg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      const reply = data.reply ?? data.error ?? "(出错了)";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "网络出错，请稍后重试。" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="chat">
      <header className="chat-header">
        <h1>Optec 公司内部问答助手</h1>
        <p>可以问我请假、报销、考勤、IT 相关的问题</p>
      </header>

      <main className="chat-body">
        {messages.length === 0 && (
          <div className="empty-tip">还没有对话，在下方输入你的问题试试吧～</div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`row ${m.role}`}>
            <div className="bubble">{m.content}</div>
          </div>
        ))}

        {loading && (
          <div className="row assistant">
            <div className="bubble typing">正在思考…</div>
          </div>
        )}
      </main>

      <footer className="chat-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="输入问题，回车发送（Shift+回车换行）"
          rows={1}
        />
        <button onClick={send} disabled={loading || !input.trim()}>
          发送
        </button>
      </footer>
    </div>
  );
}
