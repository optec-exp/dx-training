"use client";

import { useState } from "react";
import { getZhName } from "@/lib/airports";
import type { Airport } from "@/lib/airports";

interface Props {
  airport: Airport;
  query: string;
  onClick: (airport: Airport) => void;
  onHover?: (airport: Airport | null) => void;
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} style={{ backgroundColor: "#fef3d0", color: "#8a5c00", borderRadius: "2px" }}>
        {part}
      </mark>
    ) : (
      part
    )
  );
}

const REGION_COLORS: Record<string, { bg: string; text: string }> = {
  亚洲:   { bg: "#e8f5ee", text: "#1e6b40" },
  中东:   { bg: "#fdf0e0", text: "#8a4e00" },
  欧洲:   { bg: "#e8eef8", text: "#1e3a8a" },
  北美:   { bg: "#ede8f8", text: "#4a1e8a" },
  南美:   { bg: "#fde8f0", text: "#8a1e4a" },
  大洋洲: { bg: "#e0f2f8", text: "#0c5a72" },
  非洲:   { bg: "#f8ede8", text: "#8a3a1e" },
  南极洲: { bg: "#f0f0f0", text: "#555555" },
};

export default function AirportCard({ airport, query, onClick, onHover }: Props) {
  const [hovered, setHovered] = useState(false);
  const rs = REGION_COLORS[airport.region] ?? { bg: "#eceef2", text: "#5a6a80" };
  const zhName = getZhName(airport.iata);

  return (
    <button
      onClick={() => onClick(airport)}
      onMouseEnter={() => { setHovered(true); onHover?.(airport); }}
      onMouseLeave={() => { setHovered(false); onHover?.(null); }}
      className="text-left rounded-xl p-4 w-full transition-all duration-200"
      style={{
        backgroundColor: "#ffffff",
        border: `1.5px solid ${hovered ? "#b8933a" : "#e2e6ed"}`,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* IATA + ICAO */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-wider" style={{ color: "#b8933a" }}>
            {highlight(airport.iata, query)}
          </span>
          {airport.icao && (
            <span
              className="text-xs px-1.5 py-0.5 rounded font-mono"
              style={{ backgroundColor: "#eceef2", color: "#8a95a3" }}
            >
              {highlight(airport.icao, query)}
            </span>
          )}
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-1"
          style={{ backgroundColor: rs.bg, color: rs.text }}
        >
          {airport.region}
        </span>
      </div>

      {/* 机场名 */}
      {zhName && (
        <div className="text-sm font-medium leading-snug mb-0.5" style={{ color: "#1a2535" }}>
          {highlight(zhName, query)}
        </div>
      )}
      <div
        className={`leading-snug mb-2 ${zhName ? "text-xs" : "text-sm font-medium"}`}
        style={{ color: zhName ? "#8a95a3" : "#1a2535" }}
      >
        {highlight(airport.name_en, query)}
      </div>

      {/* 城市 / 国家 */}
      <div className="flex items-center gap-1 text-xs" style={{ color: "#aab0ba" }}>
        <span>📍</span>
        {airport.city && <span>{highlight(airport.city, query)}</span>}
        {airport.city && <span>·</span>}
        <span>{highlight(airport.country, query)}</span>
      </div>
    </button>
  );
}
