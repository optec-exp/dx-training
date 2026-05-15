"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Post = {
  id: string;
  user_email: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  created_at: string;
};

export default function Home() {
  const router = useRouter();
  const [user, setUser]           = useState<User | null>(null);
  const [posts, setPosts]         = useState<Post[]>([]);
  const [query, setQuery]         = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected]   = useState<Post | null>(null);

  // 新帖表单
  const [title, setTitle]     = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [aiStep, setAiStep]   = useState("");

  // ── 认证检查 ────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/auth");
      else setUser(data.user);
    });
  }, [router]);

  // ── 加载 / 搜索文章 ──────────────────────────────────────
  const loadPosts = useCallback(async (q = "") => {
    let query_builder = supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (q.trim()) {
      // 全文搜索：tsvector + plainto_tsquery
      query_builder = query_builder.textSearch("search_vector", q.trim(), {
        type: "plain",
        config: "simple",
      });
    }

    const { data } = await query_builder.limit(50);
    setPosts(data ?? []);
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // ── 搜索防抖 ─────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => loadPosts(query), 300);
    return () => clearTimeout(t);
  }, [query, loadPosts]);

  // ── 发帖流程：AI 摘要 → 写入 Supabase ───────────────────
  const handlePost = async () => {
    if (!title.trim() || !content.trim() || !user) return;
    setPosting(true);
    setAiStep("AI 正在生成摘要和标签…");

    // ① 调用 Claude API 生成摘要 + 标签
    let summary = "";
    let tags: string[] = [];
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const json = await res.json() as { summary: string; tags: string[] };
      summary = json.summary ?? "";
      tags    = json.tags    ?? [];
    } catch {
      summary = "";
      tags    = [];
    }

    setAiStep("保存中…");

    // ② 写入 Supabase
    await supabase.from("posts").insert({
      user_id:    user.id,
      user_email: user.email,
      title,
      content,
      summary,
      tags,
    });

    // ③ 重置
    setTitle("");
    setContent("");
    setPosting(false);
    setAiStep("");
    setShowModal(false);
    loadPosts(query);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <h1 className="text-base font-bold text-gray-800 shrink-0">📚 知识库</h1>

          {/* 搜索框 */}
          <input
            type="text"
            placeholder="全文搜索…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />

          <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
            {user.email}
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 shrink-0"
          >
            + 发帖
          </button>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
          >
            退出
          </button>
        </div>
      </header>

      {/* ── Post List ─────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            {query ? "没有找到相关文章" : "还没有文章，点「+ 发帖」发布第一篇"}
          </div>
        ) : (
          posts.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              className="bg-white rounded-2xl border border-gray-200 px-6 py-4 hover:shadow-md cursor-pointer transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-sm font-bold text-gray-800 leading-snug">{p.title}</h2>
                <span className="text-xs text-gray-400 shrink-0 mt-0.5">
                  {new Date(p.created_at).toLocaleDateString("zh-CN")}
                </span>
              </div>
              {p.summary && (
                <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">
                  {p.summary}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {(p.tags ?? []).map((tag) => (
                  <span key={tag} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
                <span className="text-xs text-gray-300 ml-auto">{p.user_email}</span>
              </div>
            </div>
          ))
        )}
      </main>

      {/* ── 新帖弹窗 ──────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={() => !posting && setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">新建文章</h2>
              {!posting && (
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
              )}
            </div>

            <input
              type="text"
              placeholder="标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={posting}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            />
            <textarea
              placeholder="内容"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={posting}
              rows={6}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 resize-none"
            />

            {aiStep && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                {aiStep}
              </div>
            )}

            <button
              onClick={handlePost}
              disabled={posting || !title.trim() || !content.trim()}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
            >
              {posting ? "处理中…" : "发布（AI 自动生成摘要 + 标签）"}
            </button>
          </div>
        </div>
      )}

      {/* ── 文章详情弹窗 ──────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-base font-bold text-gray-800 leading-snug">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl shrink-0">×</button>
            </div>

            {selected.summary && (
              <div className="bg-blue-50 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-blue-700 mb-1">AI 摘要</p>
                <p className="text-sm text-blue-800 leading-relaxed">{selected.summary}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {(selected.tags ?? []).map((tag) => (
                <span key={tag} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>

            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.content}</p>

            <p className="text-xs text-gray-400">
              {selected.user_email} · {new Date(selected.created_at).toLocaleString("zh-CN")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
