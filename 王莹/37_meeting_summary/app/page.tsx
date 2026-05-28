"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type ActionItem = { task: string; owner: string; due: string };

type Minute = {
  id: string;
  raw_text: string;
  summary: string;
  action_items: ActionItem[];
  model: string;
  created_at: string;
};

type Status = "idle" | "streaming" | "done" | "error";

export default function Home() {
  const [rawText, setRawText] = useState("");
  const [summary, setSummary] = useState("");
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [history, setHistory] = useState<Minute[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 打字机效果：服务器收到的文字进 targetRef，定时器逐字揭示到 shownRef
  const targetRef = useRef("");
  const shownRef = useRef("");
  const finishedRef = useRef(false);

  // 加载历史记录
  async function loadHistory() {
    const { data, error } = await supabase
      .from("meeting_minutes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data) setHistory(data as Minute[]);
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleGenerate() {
    if (!rawText.trim() || status === "streaming") return;

    // 重置上一次的结果
    setSummary("");
    setActionItems([]);
    setErrorMsg("");
    setStatus("streaming");

    // 重置打字机缓冲
    targetRef.current = "";
    shownRef.current = "";
    finishedRef.current = false;

    // 打字机定时器：每 20ms 揭示几个字，追上服务器已收到的内容
    const typer = setInterval(() => {
      const target = targetRef.current;
      if (shownRef.current.length < target.length) {
        // 落后越多揭示越快，避免长摘要拖太久
        const remaining = target.length - shownRef.current.length;
        const step = remaining > 60 ? 4 : 2;
        const next = target.slice(0, shownRef.current.length + step);
        shownRef.current = next;
        setSummary(next);
      } else if (finishedRef.current) {
        clearInterval(typer);
      }
    }, 20);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });

      if (!res.ok || !res.body) {
        const t = await res.text();
        setErrorMsg("请求失败：" + t);
        setStatus("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 按换行切分，逐行解析 NDJSON
        let idx: number;
        while ((idx = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line) continue;

          const msg = JSON.parse(line);
          if (msg.type === "summary_delta") {
            // 不直接显示，喂给打字机缓冲
            targetRef.current += msg.text;
          } else if (msg.type === "done") {
            setActionItems(msg.action_items ?? []);
            setStatus("done");
            loadHistory();
          } else if (msg.type === "error") {
            setErrorMsg(msg.message);
            setStatus("error");
          }
        }
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStatus("error");
    } finally {
      // 通知打字机：服务器流已结束，揭示完剩余文字后自行停止
      finishedRef.current = true;
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">会议纪要 AI 助手</h1>
          <p className="mt-1 text-sm text-slate-500">
            粘贴会议记录，自动生成摘要与行动项，并保存到历史记录
          </p>
        </header>

        {/* ① 输入区 */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            会议记录原文
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="把会议记录粘贴到这里……例如：今天的产品周会讨论了三件事……"
            rows={7}
            className="w-full resize-y rounded-lg border border-slate-300 p-3 text-sm leading-relaxed outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {rawText.length} 字
            </span>
            <button
              onClick={handleGenerate}
              disabled={status === "streaming" || !rawText.trim()}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {status === "streaming" ? "生成中……" : "生成摘要"}
            </button>
          </div>
        </section>

        {/* ② 结果区 */}
        {(status === "streaming" || status === "done" || status === "error") && (
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {errorMsg ? (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                出错了：{errorMsg}
              </div>
            ) : (
              <>
                <h2 className="mb-2 text-sm font-semibold text-slate-700">
                  📝 摘要
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                  {summary}
                  {status === "streaming" && (
                    <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-blue-500 align-middle" />
                  )}
                </p>

                {status === "done" && (
                  <div className="mt-5">
                    <h2 className="mb-2 text-sm font-semibold text-slate-700">
                      ✅ 行动项（{actionItems.length}）
                    </h2>
                    {actionItems.length === 0 ? (
                      <p className="text-sm text-slate-400">未发现明确的行动项</p>
                    ) : (
                      <ul className="space-y-2">
                        {actionItems.map((item, i) => (
                          <li
                            key={i}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
                          >
                            <div className="font-medium text-slate-800">
                              {item.task}
                            </div>
                            <div className="mt-1 flex gap-4 text-xs text-slate-500">
                              <span>负责人：{item.owner || "—"}</span>
                              <span>截止：{item.due || "—"}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ③ 历史记录 */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            历史记录（{history.length}）
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">还没有记录</p>
          ) : (
            <ul className="space-y-2">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === item.id ? null : item.id)
                    }
                    className="flex w-full items-center justify-between gap-3 p-4 text-left"
                  >
                    <span className="truncate text-sm text-slate-700">
                      {item.summary || item.raw_text}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatDate(item.created_at)}
                    </span>
                  </button>

                  {expandedId === item.id && (
                    <div className="border-t border-slate-100 p-4 text-sm">
                      <div className="mb-3">
                        <div className="mb-1 font-semibold text-slate-600">
                          📝 摘要
                        </div>
                        <p className="whitespace-pre-wrap text-slate-800">
                          {item.summary}
                        </p>
                      </div>
                      <div className="mb-3">
                        <div className="mb-1 font-semibold text-slate-600">
                          ✅ 行动项
                        </div>
                        {item.action_items.length === 0 ? (
                          <p className="text-slate-400">无</p>
                        ) : (
                          <ul className="list-inside list-disc space-y-1 text-slate-800">
                            {item.action_items.map((a, i) => (
                              <li key={i}>
                                {a.task}
                                {a.owner ? `（${a.owner}` : ""}
                                {a.owner && a.due ? ` · ${a.due}）` : ""}
                                {a.owner && !a.due ? "）" : ""}
                                {!a.owner && a.due ? `（${a.due}）` : ""}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <details className="text-xs text-slate-500">
                        <summary className="cursor-pointer">原文</summary>
                        <p className="mt-1 whitespace-pre-wrap">
                          {item.raw_text}
                        </p>
                      </details>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
