"use client";

import { useState, useEffect, useCallback } from "react";
import { searchAirports, type Airport } from "@/lib/airports";
import AirportCard from "./AirportCard";
import AirportDetail from "./AirportDetail";

const REGIONS = ["全部", "亚洲", "欧洲", "北美", "南美", "大洋洲", "非洲", "中东"];

// 中东国家代码（OurAirports 把中东归入亚洲，这里单独拆出来）
const MIDDLE_EAST_CODES = new Set([
  "AE", "BH", "IQ", "IR", "IL", "JO", "KW", "LB", "OM", "QA", "SA", "SY", "TR", "YE", "PS",
]);

function normalizeRegion(airport: Airport): string {
  if (airport.region === "亚洲" && MIDDLE_EAST_CODES.has(airport.country_code)) {
    return "中东";
  }
  return airport.region;
}

export default function AirportSearch() {
  const [allAirports, setAllAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("全部");
  const [results, setResults] = useState<Airport[]>([]);
  const [selected, setSelected] = useState<Airport | null>(null);
  const [preload, setPreload] = useState<Airport | null>(null);

  // 加载完整机场数据
  useEffect(() => {
    fetch("/airports.json")
      .then((r) => r.json())
      .then((data: Airport[]) => {
        setAllAirports(data);
        setLoading(false);
      });
  }, []);

  // 防抖 300ms
  useEffect(() => {
    const timer = setTimeout(() => setQuery(inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // 搜索 + 区域筛选
  useEffect(() => {
    if (loading) return;

    let data = query.trim() ? searchAirports(allAirports, query) : allAirports;

    if (selectedRegion !== "全部") {
      data = data.filter((a) => normalizeRegion(a) === selectedRegion);
    }

    // 无搜索词时最多显示 200 条（避免渲染卡顿）
    if (!query.trim()) data = data.slice(0, 200);

    setResults(data);
    setSelected(null);
  }, [query, selectedRegion, allAirports, loading]);

  const handleSelect = useCallback((airport: Airport) => setSelected(airport), []);
  const handleClose = useCallback(() => setSelected(null), []);
  const handleHover = useCallback((airport: Airport | null) => setPreload(airport), []);

  const totalCount = selectedRegion === "全部"
    ? allAirports.length
    : allAirports.filter((a) => normalizeRegion(a) === selectedRegion).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f6f8" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e6ed" }}>
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-11 h-11 rounded-lg text-xl font-bold"
              style={{ backgroundColor: "#b8933a", color: "#ffffff" }}
            >
              ✈
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#1a2535" }}>
                Airport Code Search
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "#8a95a3" }}>
                IATA / ICAO 机场代码搜索工具 —{" "}
                {loading ? "加载中…" : `${allAirports.length.toLocaleString()} 个机场`}
              </p>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="mt-4 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base" style={{ color: "#b8933a" }}>
              🔍
            </span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入 IATA / ICAO 代码、机场名、城市或国家…"
              className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none transition-all"
              style={{
                backgroundColor: "#f5f6f8",
                border: "1.5px solid #dde1e8",
                color: "#1a2535",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#b8933a")}
              onBlur={(e) => (e.target.style.borderColor = "#dde1e8")}
            />
            {inputValue && (
              <button
                onClick={() => setInputValue("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: "#aab0ba" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* 区域筛选 */}
          <div className="mt-3 flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={
                  selectedRegion === r
                    ? { backgroundColor: "#b8933a", color: "#ffffff" }
                    : { backgroundColor: "#eceef2", color: "#5a6a80", border: "1px solid #dde1e8" }
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-5">
        {loading ? (
          <div className="text-center py-20" style={{ color: "#8a95a3" }}>
            <div className="text-3xl mb-3">✈</div>
            <div className="text-sm">正在加载机场数据…</div>
          </div>
        ) : selected ? (
          <AirportDetail airport={selected} onClose={handleClose} />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs" style={{ color: "#8a95a3" }}>
                {query.trim()
                  ? `搜索「${query}」：找到 ${results.length.toLocaleString()} 个机场`
                  : `${selectedRegion === "全部" ? "全部" : selectedRegion} ${totalCount.toLocaleString()} 个机场，显示前 ${results.length} 条`}
              </span>
              {query.trim() && results.length === 0 && (
                <span className="text-xs" style={{ color: "#b8933a" }}>
                  未找到匹配结果
                </span>
              )}
            </div>

            {results.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {results.map((airport) => (
                  <AirportCard
                    key={airport.iata}
                    airport={airport}
                    query={query}
                    onClick={handleSelect}
                    onHover={handleHover}
                  />
                ))}
              </div>
            )}

            {!query.trim() && results.length > 0 && (
              <p className="text-center text-xs mt-6" style={{ color: "#aab0ba" }}>
                输入关键词搜索全部 {totalCount.toLocaleString()} 个机场
              </p>
            )}
          </>
        )}
      </main>

      {/* 预加载：hover 时在后台静默加载地图，点击时即时显示 */}
      {preload && !selected && (
        <div style={{ position: "fixed", width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(preload.name_en)}&output=embed&hl=zh`}
            width="1"
            height="1"
            loading="eager"
            title="preload"
          />
        </div>
      )}
    </div>
  );
}
