"use client";

import { useState, useEffect, useMemo } from "react";

type Staff = { code: string; name: string };

type QuoteCase = {
  $id: { value: string };
  見積番号: { value: string };
  顧客名書出: { value: string };
  見積ステータス: { value: string | null };
  積込港: { value: string };
  仕向地: { value: string };
  見積日: { value: string | null };
  本件見積額: { value: string };
  社内担当者: { value: Staff[] };
  作成日時: { value: string };
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  見積作成中: { label: "見積作成中", color: "#92400e", bg: "#fef3c7", border: "#fcd34d" },
  見積送付済: { label: "見積送付済", color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd" },
  受注: { label: "受注", color: "#15803d", bg: "#dcfce7", border: "#86efac" },
  失注: { label: "失注", color: "#6b7280", bg: "#f3f4f6", border: "#d1d5db" },
};

const ALL_STATUSES = ["見積作成中", "見積送付済", "受注", "失注"];

function fmt(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${y}年${m}月${d}日`;
}

function fmtShort(dateStr: string | null): string {
  if (!dateStr) return "—";
  return dateStr.replace(/-/g, "/");
}

function addDays(dateStr: string | null, days: number): string {
  if (!dateStr) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, "0")}月${String(d.getDate()).padStart(2, "0")}日`;
  }
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, "0")}月${String(d.getDate()).padStart(2, "0")}日`;
}

function fmtAmount(val: string): string {
  const n = parseFloat(val);
  if (!val || isNaN(n) || n === 0) return "別途ご連絡";
  return "¥ " + Math.round(n).toLocaleString("ja-JP");
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-400 text-xs">—</span>;
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "#374151", bg: "#e5e7eb", border: "#d1d5db" };
  return (
    <span
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
      className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
    >
      {cfg.label}
    </span>
  );
}

function QuoteDocument({ c }: { c: QuoteCase }) {
  const quoteNo = c.見積番号.value || `QT-${c.$id.value}`;
  const customer = c.顧客名書出.value || "（未記入）";
  const origin = c.積込港.value || "—";
  const dest = c.仕向地.value || "—";
  const issueDate = c.見積日.value;
  const today = new Date().toISOString().split("T")[0];
  const issueDateFmt = fmt(issueDate || today);
  const validUntil = addDays(issueDate, 30);
  const amount = fmtAmount(c.本件見積額.value);
  const staff = c.社内担当者.value.map((s) => s.name).join("・") || "—";

  return (
    <div
      id="quote-doc"
      style={{
        background: "#fff",
        width: 794,
        minHeight: 1000,
        boxShadow: "0 4px 32px rgba(0,0,0,0.14)",
        borderRadius: 4,
        padding: "56px 68px 64px",
        position: "relative",
        fontFamily: "'Yu Mincho', 'Hiragino Mincho ProN', 'MS Mincho', Georgia, serif",
      }}
    >
      {/* 透かし */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-30deg)",
          fontSize: 120,
          fontWeight: 900,
          color: "rgba(26,39,68,0.03)",
          letterSpacing: 10,
          pointerEvents: "none",
          userSelect: "none",
          fontFamily: "sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        OPTEC
      </div>

      {/* ヘッダー */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, paddingBottom: 20, borderBottom: "3px solid #1a2744" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#1a2744", letterSpacing: 2, fontFamily: "sans-serif" }}>
            OPTEC EXPRESS CO., LTD.
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: 1, marginTop: 3, fontFamily: "sans-serif" }}>
            OPTEC EXPRESS FAMILY / 国際物流部
          </div>
        </div>
        <div style={{ textAlign: "right", fontFamily: "sans-serif" }}>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 3 }}>
            見積番号：<span style={{ fontWeight: 700, color: "#1a2744" }}>{quoteNo}</span>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 3 }}>
            発 行 日：<span style={{ fontWeight: 600 }}>{issueDateFmt}</span>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            有効期限：<span style={{ fontWeight: 600 }}>{validUntil}</span>
          </div>
        </div>
      </div>

      {/* タイトル */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#1a2744", letterSpacing: 8, display: "inline-block", paddingBottom: 8, borderBottom: "2px solid #b8933a" }}>
          航空運賃見積書
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8, letterSpacing: 3, fontFamily: "sans-serif" }}>
          AIR FREIGHT QUOTATION
        </div>
      </div>

      {/* 宛先 */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 8, borderBottom: "1px solid #1a2744", paddingBottom: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#1a2744" }}>{customer}</span>
          <span style={{ fontSize: 14, color: "#374151" }}>御中</span>
        </div>
        <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 2, marginTop: 12 }}>
          平素より格別のご高配を賜り、厚く御礼申し上げます。<br />
          下記の通り、航空運賃についてご見積申し上げます。<br />
          ご検討のほど、何卒よろしくお願い申し上げます。
        </p>
      </div>

      {/* 案件情報グリッド */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#2563eb", textTransform: "uppercase", marginBottom: 10, fontFamily: "sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
          案件情報
          <span style={{ flex: 1, height: 1, background: "#dbeafe", display: "inline-block" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #e5e7eb", borderRadius: 4, overflow: "hidden" }}>
          {[
            { key: "輸送区間", val: `${origin}　→　${dest}` },
            { key: "Kintone 案件 ID", val: `#${c.$id.value}` },
            { key: "見積日", val: issueDateFmt },
            { key: "有効期限", val: validUntil },
          ].map(({ key, val }, i) => (
            <div
              key={key}
              style={{
                padding: "10px 14px",
                borderBottom: i < 2 ? "1px solid #e5e7eb" : "none",
                borderRight: i % 2 === 0 ? "1px solid #e5e7eb" : "none",
                background: i % 2 === 0 ? "#fff" : "#fafafa",
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#9ca3af", fontFamily: "sans-serif", marginBottom: 4 }}>
                {key}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2744" }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 運賃明細 */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#2563eb", textTransform: "uppercase", marginBottom: 10, fontFamily: "sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
          運賃明細
          <span style={{ flex: 1, height: 1, background: "#dbeafe", display: "inline-block" }} />
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#1a2744", color: "#fff" }}>
              {["費目", "内容", "金額（JPY）"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: h === "金額（JPY）" ? "right" : "left", fontWeight: 700, fontSize: 11, letterSpacing: 1, fontFamily: "sans-serif" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "12px 14px", fontWeight: 600, color: "#374151" }}>航空運賃</td>
              <td style={{ padding: "12px 14px", color: "#6b7280" }}>{origin} → {dest}（一式）</td>
              <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, color: "#1a2744" }}>
                {c.本件見積額.value && parseFloat(c.本件見積額.value) > 0 ? fmtAmount(c.本件見積額.value) : "—"}
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "12px 14px", color: "#374151" }}>付帯費用</td>
              <td style={{ padding: "12px 14px", color: "#9ca3af", fontSize: 12 }}>サーチャージ・取扱手数料等（別途ご案内）</td>
              <td style={{ padding: "12px 14px", textAlign: "right", color: "#9ca3af" }}>別途</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ background: "#eff6ff" }}>
              <td colSpan={2} style={{ padding: "12px 14px", fontWeight: 700, color: "#1a2744", borderTop: "2px solid #2563eb" }}>
                本件見積合計金額
              </td>
              <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, fontSize: 16, color: "#1a2744", borderTop: "2px solid #2563eb" }}>
                {amount}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 備考 */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#2563eb", textTransform: "uppercase", marginBottom: 10, fontFamily: "sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
          備考・条件
          <span style={{ flex: 1, height: 1, background: "#dbeafe", display: "inline-block" }} />
        </div>
        <div style={{ padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: 4, background: "#fafafa", fontSize: 12, color: "#4b5563", lineHeight: 1.9 }}>
          ・本見積書の有効期限は発行日より30日間とさせていただきます。<br />
          ・燃油サーチャージ・セキュリティサーチャージは変動する場合がございます。<br />
          ・重量・寸法によっては追加費用が発生する場合がございます。<br />
          ・ご不明な点がございましたら、担当者までお問い合わせください。
        </div>
      </div>

      {/* 署名 */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: 240, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#9ca3af", letterSpacing: 1, marginBottom: 36, fontFamily: "sans-serif" }}>
            AUTHORIZED BY / 担当者
          </div>
          <div style={{ borderTop: "1px solid #1a2744", paddingTop: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a2744" }}>{staff}</div>
            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4, fontFamily: "sans-serif" }}>
              OPTEC EXPRESS CO., LTD.
            </div>
          </div>
        </div>
      </div>

      {/* フッター */}
      <div style={{ position: "absolute", bottom: 28, left: 68, right: 68, display: "flex", justifyContent: "space-between", fontSize: 9, color: "#d1d5db", borderTop: "1px solid #f3f4f6", paddingTop: 8, fontFamily: "sans-serif" }}>
        <span>OPTEC EXPRESS CO., LTD. — Confidential</span>
        <span>見積番号：{quoteNo}</span>
      </div>
    </div>
  );
}

export default function Page() {
  const [cases, setCases] = useState<QuoteCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<QuoteCase | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    fetch("/api/cases")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCases(data);
        else setError(JSON.stringify(data));
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const statusMatch = activeStatus === "all" || c.見積ステータス?.value === activeStatus;
      if (!statusMatch) return false;
      if (!keyword.trim()) return true;
      const kw = keyword.toLowerCase();
      return (
        c.見積番号.value.toLowerCase().includes(kw) ||
        c.顧客名書出.value.toLowerCase().includes(kw) ||
        (c.積込港.value || "").toLowerCase().includes(kw) ||
        (c.仕向地.value || "").toLowerCase().includes(kw)
      );
    });
  }, [cases, activeStatus, keyword]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: cases.length };
    ALL_STATUSES.forEach((s) => {
      map[s] = cases.filter((c) => c.見積ステータス?.value === s).length;
    });
    return map;
  }, [cases]);

  function handleSelect(c: QuoteCase) {
    setGenerating(true);
    setSelected(null);
    setTimeout(() => {
      setSelected(c);
      setGenerating(false);
    }, 600);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ===== Header ===== */}
      <header
        id="app-header"
        style={{ background: "#1a2744", color: "#fff", height: 56, flexShrink: 0 }}
        className="flex items-center px-6 gap-4 shadow-lg"
      >
        <div style={{ width: 32, height: 32, background: "#b8933a", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <div className="flex-1">
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>見積書自動生成システム</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>
            Kintone App #1000 → 航空運賃見積書 PDF
          </div>
        </div>
        <div style={{ fontSize: 11, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "3px 12px", letterSpacing: 0.5 }}>
          作品 31 / Day 23
        </div>
      </header>

      {/* ===== Body ===== */}
      <div className="flex flex-1 overflow-hidden">

        {/* ===== 左：案件リスト ===== */}
        <div
          id="case-list-panel"
          style={{ width: 440, flexShrink: 0, borderRight: "1px solid #e5e7eb", background: "#fff" }}
          className="flex flex-col overflow-hidden"
        >
          {/* フィルター */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5e7eb", background: "#f8f9fb" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              Kintone 見積案件 — App #1000
            </div>
            {/* ステータスタブ */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(["all", ...ALL_STATUSES] as const).map((s) => {
                const isActive = activeStatus === s;
                const cfg = s === "all" ? null : STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => setActiveStatus(s)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      border: isActive ? `2px solid ${cfg?.color ?? "#1a2744"}` : "2px solid transparent",
                      background: isActive ? (cfg?.bg ?? "#1a2744") : "#f3f4f6",
                      color: isActive ? (cfg?.color ?? "#fff") : "#374151",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {s === "all" ? "すべて" : s}
                    <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>({counts[s] ?? 0})</span>
                  </button>
                );
              })}
            </div>
            {/* 検索 */}
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="案件番号・顧客名・ルート検索..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{ width: "100%", padding: "6px 10px 6px 30px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 12, background: "#fff", boxSizing: "border-box", outline: "none", color: "#1a2744" }}
              />
            </div>
          </div>

          {/* 案件リスト */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#b8933a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 13 }}>Kintone からデータ取得中...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-500 text-sm">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5" /><polyline points="3,7 12,13 21,7" /></svg>
                <span style={{ fontSize: 13 }}>案件が見つかりません</span>
              </div>
            ) : (
              <div>
                {filtered.map((c) => {
                  const isSelected = selected?.$id.value === c.$id.value;
                  return (
                    <button
                      key={c.$id.value}
                      onClick={() => handleSelect(c)}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderBottom: "1px solid #f3f4f6",
                        background: isSelected ? "#eff6ff" : "transparent",
                        borderLeft: isSelected ? "3px solid #2563eb" : "3px solid transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.1s",
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f9fafb"; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? "#1d4ed8" : "#1a2744" }}>
                          {c.見積番号.value || `#${c.$id.value}`}
                        </span>
                        <StatusBadge status={c.見積ステータス?.value ?? null} />
                      </div>
                      <div style={{ fontSize: 13, color: "#374151", marginBottom: 6, fontWeight: 500 }}>
                        {c.顧客名書出.value || "（顧客名未記入）"}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>
                          {c.積込港.value || "—"}
                          <span style={{ margin: "0 4px", color: "#b8933a", fontWeight: 700 }}>→</span>
                          {c.仕向地.value || "—"}
                        </span>
                        <span>·</span>
                        <span>{fmtShort(c.見積日.value)}</span>
                        {c.本件見積額.value && parseFloat(c.本件見積額.value) > 0 && (
                          <>
                            <span>·</span>
                            <span style={{ fontWeight: 600, color: "#374151" }}>
                              ¥{Math.round(parseFloat(c.本件見積額.value)).toLocaleString()}
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* フッター */}
          {!loading && !error && (
            <div style={{ padding: "8px 16px", borderTop: "1px solid #f3f4f6", background: "#f8f9fb", fontSize: 11, color: "#9ca3af" }}>
              {filtered.length} 件表示 / 全 {cases.length} 件
            </div>
          )}
        </div>

        {/* ===== 右：見積書プレビュー ===== */}
        <div
          id="quote-preview-panel"
          className="flex-1 flex flex-col overflow-hidden"
          style={{ background: "#e5e7eb" }}
        >
          {/* ツールバー */}
          <div
            id="quote-toolbar"
            style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "10px 20px", flexShrink: 0 }}
            className="flex items-center gap-3"
          >
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                {selected
                  ? `見積書プレビュー — ${selected.見積番号.value || `#${selected.$id.value}`}`
                  : "← 案件を選択して見積書を生成"}
              </span>
              {selected && (
                <span style={{ marginLeft: 10, fontSize: 11, color: "#9ca3af" }}>
                  A4縦 / 印刷最適化済
                </span>
              )}
            </div>
            {selected && (
              <button
                onClick={handlePrint}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#1a2744", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#2563eb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#1a2744")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                PDF ダウンロード
              </button>
            )}
          </div>

          {/* プレビューエリア */}
          <div className="flex-1 overflow-y-auto" style={{ padding: "28px 24px" }}>
            {generating ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
                <div style={{ width: 40, height: 40, border: "4px solid #e5e7eb", borderTopColor: "#b8933a", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>見積書を生成中...</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Kintone データを読み込んでいます</div>
              </div>
            ) : selected ? (
              <div className="flex justify-center">
                <QuoteDocument c={selected} />
              </div>
            ) : (
              <div id="empty-state" className="flex flex-col items-center justify-center h-full gap-5">
                <div style={{ width: 72, height: 72, background: "#fff", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#b8933a" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="text-center">
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                    案件を選択してください
                  </p>
                  <p style={{ fontSize: 13, color: "#9ca3af" }}>
                    左のリストから見積案件を選ぶと<br />航空運賃見積書が即座に生成されます
                  </p>
                </div>
                <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
                  {["Kintone から取得", "テンプレートに差し込み", "PDF ダウンロード"].map((step, i) => (
                    <div key={step} className="flex flex-col items-center gap-2">
                      <div style={{ width: 36, height: 36, background: "#fff", border: "2px solid #e5e7eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#b8933a" }}>
                        {i + 1}
                      </div>
                      <span style={{ fontSize: 11, color: "#6b7280", textAlign: "center" }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
