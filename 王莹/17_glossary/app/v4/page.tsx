"use client";

import { useState, useEffect } from "react";
import glossaryData from "../../data/glossary.json";

const CATEGORIES = ["全部", "文件", "通关", "运输", "费用", "特殊货物", "操作"];

export default function V4Page() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const [filtered, setFiltered] = useState(glossaryData);
  const [mounted, setMounted] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(glossaryData.filter((item) => {
      const matchCat = category === "全部" || item.category === category;
      const matchQuery = !q ||
        item.zh.includes(query) ||
        item.en.toLowerCase().includes(q) ||
        item.ja.toLowerCase().includes(q) ||
        (item.abbr && item.abbr.toLowerCase().includes(q));
      return matchCat && matchQuery;
    }));
    setExpandedId(null);
  }, [query, category]);

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      {/* Header */}
      <header style={{ background: "#ffffff", borderBottom: "2px solid #000000", padding: "32px 0 24px" }}>
        <div className="max-w-5xl mx-auto px-8">
          <p style={{ fontSize: "11px", letterSpacing: "4px", color: "#999", textTransform: "uppercase", marginBottom: "8px" }}>
            OPTEC Express · Air Freight Reference
          </p>
          <div className="flex items-end justify-between">
            <h1 style={{ fontSize: "36px", fontWeight: "900", color: "#000", letterSpacing: "-1px", lineHeight: 1 }}>
              术语词典
            </h1>
            <p style={{ fontSize: "13px", color: "#888", textAlign: "right", lineHeight: "1.5" }}>
              Glossary of Air Freight<br />Terminology
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8">
        {/* Search */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#999" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索（中文 / English / 日本語 / 缩写）"
              className="w-full pl-6 pr-0 py-2 outline-none"
              style={{ background: "transparent", borderBottom: "1px solid #000", color: "#000", fontSize: "14px", borderRadius: 0 }}
            />
          </div>
          <div style={{ fontSize: "13px", color: "#999", display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
            <span style={{ color: "#000", fontWeight: "700" }}>{filtered.length}</span> / {glossaryData.length}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-0 mb-8" style={{ borderBottom: "1px solid #e0e0e0" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-4 py-2 text-sm cursor-pointer transition-all duration-150"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: category === cat ? "2px solid #000" : "2px solid transparent",
                color: category === cat ? "#000" : "#999",
                fontWeight: category === cat ? "700" : "400",
                marginBottom: "-1px",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#bbb" }}>没有找到匹配的术语</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {filtered.map((item, i) => {
              const isHovered = hoveredId === item.id;
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    borderTop: "1px solid #e0e0e0",
                    borderRight: i % 2 === 0 ? "1px solid #e0e0e0" : "none",
                    background: isExpanded || isHovered ? "#f5f5f5" : "#fafafa",
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(8px)",
                    transition: `opacity 0.25s ease ${i * 15}ms, transform 0.25s ease ${i * 15}ms, background 0.15s`,
                  }}
                >
                  {/* Main content */}
                  <div style={{ padding: "20px 24px 20px" }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span style={{ fontSize: "18px", fontWeight: "800", color: "#000", letterSpacing: "-0.3px" }}>{item.zh}</span>
                        {item.abbr && (
                          <span style={{ marginLeft: "8px", fontSize: "11px", color: "#999", fontWeight: "600", letterSpacing: "1px" }}>
                            {item.abbr}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "11px", color: "#aaa", whiteSpace: "nowrap", marginLeft: "12px", marginTop: "4px", letterSpacing: "0.5px" }}>
                        {item.category}
                      </span>
                    </div>
                    <p style={{ fontSize: "12.5px", color: "#555", marginBottom: "2px" }}>{item.en}</p>
                    <p style={{ fontSize: "11.5px", color: "#aaa", marginBottom: "10px" }}>{item.ja}</p>
                    <p style={{ fontSize: "12.5px", color: "#666", lineHeight: "1.65", paddingTop: "10px", borderTop: "1px solid #ebebeb" }}>
                      {item.description}
                    </p>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      style={{
                        marginTop: "10px",
                        background: "none",
                        border: "none",
                        padding: "0",
                        fontSize: "11px",
                        color: isExpanded ? "#000" : "#aaa",
                        cursor: "pointer",
                        letterSpacing: "0.5px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span style={{ display: "inline-block", transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                      {isExpanded ? "收起详细说明" : "查看详细说明"}
                    </button>
                  </div>

                  {/* Expandable detail */}
                  <div style={{ maxHeight: isExpanded ? "600px" : "0", overflow: "hidden", transition: "max-height 0.35s ease" }}>
                    <div style={{ padding: "0 24px 20px", borderTop: "1px solid #e0e0e0" }}>
                      {item.detail.split("\n\n").map((para, pi) => (
                        <p key={pi} style={{ fontSize: "12.5px", color: "#444", lineHeight: "1.75", marginTop: "12px" }}>
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && <div style={{ borderTop: "1px solid #e0e0e0" }} />}
      </main>

      <footer className="text-center py-6 mt-8" style={{ borderTop: "1px solid #e0e0e0", color: "#bbb", fontSize: "11px", letterSpacing: "1px" }}>
        OPTEC EXPRESS CO., LTD. — INTERNAL REFERENCE ONLY
      </footer>
    </div>
  );
}
