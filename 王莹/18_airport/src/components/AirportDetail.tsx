"use client";

import { getZhName } from "@/lib/airports";
import type { Airport } from "@/lib/airports";

interface Props {
  airport: Airport;
  onClose: () => void;
}

export default function AirportDetail({ airport, onClose }: Props) {
  const zhName = getZhName(airport.iata);
  const mapQuery = encodeURIComponent(airport.name_en);
  const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&output=embed&hl=zh`;

  return (
    <div>
      <button
        onClick={onClose}
        className="mb-5 flex items-center gap-2 text-sm transition-colors"
        style={{ color: "#8a95a3" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#b8933a")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#8a95a3")}
      >
        ← 返回搜索结果
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 左栏：机场信息 */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: "#ffffff", border: "1.5px solid #e2e6ed" }}
        >
          <div className="mb-6">
            <div className="text-6xl font-bold tracking-widest mb-2" style={{ color: "#b8933a" }}>
              {airport.iata}
            </div>
            {airport.icao && (
              <div
                className="text-sm font-mono px-2 py-1 rounded inline-block"
                style={{ backgroundColor: "#eceef2", color: "#5a6a80" }}
              >
                ICAO: {airport.icao}
              </div>
            )}
          </div>

          <div className="space-y-0">
            {zhName && <InfoRow label="中文名称" value={zhName} />}
            <InfoRow label="英文名称" value={airport.name_en} />
            {airport.city && <InfoRow label="所在城市" value={airport.city} />}
            <InfoRow label="国家 / 地区" value={airport.country} />
            <InfoRow label="区域" value={airport.region} />
          </div>

          <div
            className="mt-6 rounded-lg p-4 text-xs leading-relaxed"
            style={{ backgroundColor: "#f8f9fb", border: "1px solid #e2e6ed", color: "#8a95a3" }}
          >
            <p className="mb-1">
              <span style={{ color: "#b8933a" }}>IATA</span> 代码为3位字母，用于机票、行李标签、货运单（AWB）等旅客与货运文件。
            </p>
            <p>
              <span style={{ color: "#b8933a" }}>ICAO</span> 代码为4位字母数字，用于飞行计划、空管通讯等航空运营场景。
            </p>
          </div>
        </div>

        {/* 右栏：地图 */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1.5px solid #e2e6ed", minHeight: "420px" }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e6ed" }}
          >
            <span style={{ color: "#b8933a" }}>📍</span>
            <span className="text-sm font-medium" style={{ color: "#1a2535" }}>
              {airport.city ? `${airport.city} — ` : ""}{zhName ?? airport.name_en}
            </span>
          </div>
          <iframe
            src={mapSrc}
            width="100%"
            height="380"
            style={{ border: 0, display: "block" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`${airport.name_en} 地图`}
          />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-3" style={{ borderBottom: "1px solid #f0f2f5" }}>
      <span className="text-xs w-24 shrink-0 mt-0.5" style={{ color: "#8a95a3" }}>
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: "#1a2535" }}>
        {value}
      </span>
    </div>
  );
}
