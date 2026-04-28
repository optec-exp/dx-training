"use client";

import { useState, useMemo } from "react";
import { terms, Term } from "./data/terms";
import TermCard from "./components/TermCard";

type Filter = "全部" | "物流操作" | "财务";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Page() {
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<Filter>("全部");

  const filtered = useMemo<Term[]>(() => {
    const kw = keyword.toLowerCase();
    return terms.filter((t) => {
      if (filter !== "全部" && t.cat !== filter) return false;
      if (!kw) return true;
      return (
        t.term.toLowerCase().includes(kw) ||
        t.full.toLowerCase().includes(kw) ||
        t.def.includes(kw) ||
        (t.example ?? "").includes(kw)
      );
    });
  }, [keyword, filter]);

  const grouped = useMemo(() => {
    const map: Record<string, Term[]> = {};
    filtered.forEach((t) => {
      const letter = t.term[0].toUpperCase();
      map[letter] = map[letter] || [];
      map[letter].push(t);
    });
    return map;
  }, [filtered]);

  const existingLetters = useMemo(
    () => new Set(terms.map((t) => t.term[0].toUpperCase())),
    []
  );

  const logisticsCount = terms.filter((t) => t.cat === "物流操作").length;
  const financeCount = terms.filter((t) => t.cat === "财务").length;

  function scrollToLetter(letter: string) {
    const el = document.getElementById("letter-" + letter);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-blue-800 text-white py-8 px-6 text-center">
        <h1 className="text-2xl font-bold tracking-widest">OPTEC 内部术语词典</h1>
        <p className="mt-1.5 text-sm text-blue-200">物流操作 · 财务类 · 快速检索</p>
      </header>

      {/* Sticky search */}
      <div className="sticky top-0 z-50 bg-white shadow-sm px-6 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索术语、全称或释义…"
            className="flex-1 border-2 border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {keyword ? `找到 ${filtered.length} 条` : `共 ${terms.length} 条`}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6">
        {/* Stats */}
        <div className="flex gap-3 mt-5">
          {[
            { label: "全部词条", value: terms.length },
            { label: "物流操作", value: logisticsCount },
            { label: "财务类", value: financeCount },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg px-4 py-2.5 text-sm shadow-sm">
              <span className="text-gray-500">{s.label} </span>
              <strong className="text-gray-800">{s.value}</strong>
            </div>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-2.5 mt-4">
          {(["全部", "物流操作", "财务"] as Filter[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium border-2 transition-all
                ${filter === cat
                  ? cat === "物流操作"
                    ? "bg-blue-600 border-blue-600 text-white"
                    : cat === "财务"
                    ? "bg-emerald-700 border-emerald-700 text-white"
                    : "bg-slate-700 border-slate-700 text-white"
                  : "bg-white border-slate-200 text-gray-600 hover:border-blue-400"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Alpha index */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {LETTERS.map((l) => {
            const has = existingLetters.has(l);
            return (
              <button
                key={l}
                disabled={!has}
                onClick={() => has && scrollToLetter(l)}
                className={`w-7 h-7 rounded text-xs font-bold flex items-center justify-center border transition-colors
                  ${has
                    ? "border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer"
                    : "border-slate-100 text-slate-300 cursor-default"}`}
              >
                {l}
              </button>
            );
          })}
        </div>

        {/* Results */}
        <main className="mt-6 mb-16">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">🔍</div>
              <p>没有找到「{keyword}」相关术语</p>
            </div>
          ) : (
            Object.keys(grouped).sort().map((letter) => (
              <div key={letter} id={"letter-" + letter} className="mb-6">
                <div className="text-blue-600 font-bold text-base border-b-2 border-blue-100 pb-1.5 mb-3">
                  {letter}
                </div>
                {grouped[letter].map((t) => (
                  <TermCard key={t.term + t.cat} term={t} keyword={keyword} />
                ))}
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
