"use client";

import { Term } from "../data/terms";

interface Props {
  term: Term;
  keyword: string;
}

function highlight(text: string, kw: string) {
  if (!kw) return text;
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === kw.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-px">{p}</mark>
      : p
  );
}

export default function TermCard({ term, keyword }: Props) {
  const isLogistics = term.cat === "物流操作";
  return (
    <div className={`
      bg-white rounded-xl px-5 py-4 mb-3
      border-l-4 shadow-sm hover:shadow-md hover:-translate-y-0.5
      transition-all duration-200 cursor-default
      ${isLogistics ? "border-blue-600" : "border-emerald-700"}
    `}>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-bold text-gray-900 text-base">{highlight(term.term, keyword)}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
          ${isLogistics
            ? "bg-blue-50 text-blue-700"
            : "bg-emerald-50 text-emerald-700"}`}>
          {term.cat}
        </span>
      </div>
      {term.full && (
        <div className="text-sm text-gray-400 mb-1">{highlight(term.full, keyword)}</div>
      )}
      <div className="text-sm text-gray-700 leading-relaxed">{highlight(term.def, keyword)}</div>
      {term.example && (
        <div className="mt-1.5 text-xs text-gray-400 italic">例：{highlight(term.example, keyword)}</div>
      )}
    </div>
  );
}
