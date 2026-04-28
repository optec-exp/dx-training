"use client";

import { useState, useEffect } from "react";
import glossaryData from "../data/glossary.json";

const CATEGORIES = ["全部", "文件", "通关", "运输", "费用", "特殊货物", "操作"];

const CATEGORY_COLORS: Record<string, string> = {
  文件: "bg-blue-900/60 text-blue-200 border-blue-700",
  通关: "bg-amber-900/50 text-amber-200 border-amber-700",
  运输: "bg-emerald-900/50 text-emerald-200 border-emerald-700",
  费用: "bg-purple-900/50 text-purple-200 border-purple-700",
  特殊货物: "bg-red-900/50 text-red-200 border-red-700",
  操作: "bg-cyan-900/50 text-cyan-200 border-cyan-700",
};

export default function GlossaryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const [filtered, setFiltered] = useState(glossaryData);
  const [mounted, setMounted] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const q = query.toLowerCase();
    const result = glossaryData.filter((item) => {
      const matchCat = category === "全部" || item.category === category;
      const matchQuery =
        !q ||
        item.ja.toLowerCase().includes(q) ||
        item.en.toLowerCase().includes(q) ||
        item.zh.includes(query) ||
        (item.abbr && item.abbr.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
    setFiltered(result);
  }, [query, category]);

  return (
    <div className="min-h-screen" style={{ background: "#0a1628" }}>
      {/* Header */}
      <header className="border-b border-white/10" style={{ background: "rgba(10,22,40,0.95)" }}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{ background: "#c9a84c", color: "#0a1628" }}
            >
              17
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">
                OPTEC 航空货运术语词典
              </h1>
              <p className="text-sm text-white/50 mt-0.5">
                Glossary of Air Freight Terminology ／ 航空貨物用語辞典
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search + Stats */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索术语（中文 / English / 日本語 / 缩写）..."
              className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-white/30 outline-none border border-white/10 focus:border-amber-400/60"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
          </div>
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-sm text-white/50 whitespace-nowrap"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <span style={{ color: "#c9a84c" }} className="font-bold text-base">{filtered.length}</span>
            <span>/ {glossaryData.length} 条</span>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer"
              style={
                category === cat
                  ? { background: "#c9a84c", color: "#0a1628", borderColor: "#c9a84c" }
                  : { background: "transparent", color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.15)" }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <p className="text-4xl mb-3">🔍</p>
            <p>没有找到匹配的术语</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item, i) => (
              <div
                key={item.id}
                className="rounded-xl p-5"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: hoveredId === item.id ? "1px solid rgba(201,168,76,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? (hoveredId === item.id ? "translateY(-3px)" : "translateY(0)") : "translateY(16px)",
                  boxShadow: hoveredId === item.id ? "0 8px 24px rgba(0,0,0,0.3)" : "none",
                  transition: `opacity 0.3s ease ${i * 20}ms, transform 0.3s ease ${i * 20}ms, border-color 0.2s, box-shadow 0.2s`,
                }}
              >
                {/* Top row: abbr + category */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    {item.abbr && (
                      <span
                        className="px-2.5 py-0.5 rounded text-xs font-bold tracking-widest"
                        style={{ background: "#c9a84c22", color: "#c9a84c", border: "1px solid #c9a84c44" }}
                      >
                        {item.abbr}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs border ${CATEGORY_COLORS[item.category] || "bg-white/10 text-white/60 border-white/20"}`}
                  >
                    {item.category}
                  </span>
                </div>

                {/* Terms */}
                <div className="mb-3">
                  <p className="text-white font-semibold text-base leading-snug">{item.zh}</p>
                  <p className="text-white/50 text-sm mt-0.5">{item.en}</p>
                  <p className="text-white/35 text-xs mt-0.5">{item.ja}</p>
                </div>

                {/* Description */}
                <p className="text-white/55 text-sm leading-relaxed border-t border-white/8 pt-3">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/8 mt-12 py-6 text-center text-white/25 text-xs">
        OPTEC Express Co., Ltd. — 内部学习资料 ／ Internal Reference Only
      </footer>
    </div>
  );
}
