"use client";

import { useState, useCallback } from "react";

type UserSelectValue = { code: string; name: string };

type KintoneRecord = {
  $id:                { value: string };
  顧客名ルックアップ:  { value: string };
  見積番号:           { value: string };
  経路:               { value: string };
  見積ステータス:     { value: string };
  社内担当者:         { value: UserSelectValue[] };
  品名:               { value: string };
};

const STATUS_COLOR: Record<string, string> = {
  "見積作成中": "#60a5fa",
  "見積送付済": "#f97316",
  "受注":       "#4caf50",
  "失注":       "#888",
  "保留":       "#aaa",
};

export default function QuotePage() {
  const [query, setQuery]           = useState("");
  const [records, setRecords]       = useState<KintoneRecord[]>([]);
  const [loading, setLoading]       = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError]           = useState("");
  const [searched, setSearched]     = useState(false);

  const search = useCallback(async () => {
    setLoading(true); setError(""); setSearched(true);
    try {
      const res = await fetch(`/api/records?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecords(data.records ?? []);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, [query]);

  const generate = async (record: KintoneRecord) => {
    const id = record.$id.value;
    setGenerating(id);
    try {
      const 担当者名 = record.社内担当者?.value?.[0]?.name ?? "";
      const payload = {
        顧客名:          record.顧客名ルックアップ?.value ?? "",
        案件番号:        record.見積番号?.value            ?? "",
        経路:            record.経路?.value                ?? "",
        件名:            record.品名?.value                ?? "",
        操作ステータス:   record.見積ステータス?.value      ?? "",
        担当者名,
      };
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `見積書_${payload.顧客名}_${payload.案件番号}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError(String(e)); }
    finally { setGenerating(null); }
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <div style={s.badge}>OPTEC · 報価単自動生成</div>
          <h1 style={s.title}>見積書 自動生成システム</h1>
          <p style={s.subtitle}>Kintone の案件を検索して、一键で見積 PDF を生成します</p>
        </div>
        <div style={s.flowWrap}>
          {[
            { label: "① Kintone 検索", color: "var(--gold)" },
            { label: "② 案件選択",     color: "#60a5fa" },
            { label: "③ PDF 生成",     color: "#4caf50" },
          ].map((step, i) => (
            <div key={i} style={s.flowStep}>
              <span style={{ ...s.flowDot, background: step.color }} />
              <span style={s.flowLabel}>{step.label}</span>
              {i < 2 && <span style={s.flowArrow}>→</span>}
            </div>
          ))}
        </div>
      </header>

      <div style={s.body}>
        {/* Search */}
        <div style={s.searchCard}>
          <div style={s.cardTitle}>🔍 案件を検索</div>
          <div style={s.searchRow}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="顧客名で検索（空白で全件取得）"
              onKeyDown={e => e.key === "Enter" && search()}
              style={{ flex: 1 }}
            />
            <button
              style={{ ...s.searchBtn, opacity: loading ? 0.7 : 1 }}
              onClick={search}
              disabled={loading}
            >
              {loading ? "検索中…" : "🔍 検索"}
            </button>
          </div>
          {error && <div style={s.errorBox}>⚠ {error}</div>}
        </div>

        {/* Results */}
        {searched && (
          <div style={s.resultCard}>
            <div style={{ ...s.cardTitle, marginBottom: 14 }}>
              📋 検索結果
              <span style={s.countBadge}>{records.length} 件</span>
            </div>

            {records.length === 0 ? (
              <div style={s.empty}>該当する案件が見つかりません</div>
            ) : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {["顧客名", "見積番号", "経路", "品名", "ステータス", "担当者", ""].map((h, i) => (
                        <th key={i} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec, ri) => {
                      const id = rec.$id.value;
                      const status = rec.見積ステータス?.value ?? "";
                      const 担当者 = rec.社内担当者?.value?.[0]?.name ?? "—";
                      return (
                        <tr key={ri} style={ri % 2 === 0 ? s.trEven : s.trOdd}>
                          <td style={{ ...s.td, fontWeight: 600 }}>{rec.顧客名ルックアップ?.value || "—"}</td>
                          <td style={s.td}>{rec.見積番号?.value || "—"}</td>
                          <td style={s.td}>{rec.経路?.value || "—"}</td>
                          <td style={{ ...s.td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {rec.品名?.value || "—"}
                          </td>
                          <td style={s.td}>
                            <span style={{
                              ...s.statusBadge,
                              background: `${STATUS_COLOR[status] ?? "#888"}22`,
                              color: STATUS_COLOR[status] ?? "#888",
                              border: `1px solid ${STATUS_COLOR[status] ?? "#888"}55`,
                            }}>
                              {status || "—"}
                            </span>
                          </td>
                          <td style={s.td}>{担当者}</td>
                          <td style={s.td}>
                            <button
                              style={{
                                ...s.genBtn,
                                opacity: generating === id ? 0.6 : 1,
                              }}
                              onClick={() => generate(rec)}
                              disabled={generating === id}
                            >
                              {generating === id ? "⏳ 生成中…" : "📄 PDF"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!searched && (
          <div style={s.hintCard}>
            <div style={s.hintIcon}>📄</div>
            <div style={s.hintTitle}>検索して案件を選択してください</div>
            <div style={s.hintDesc}>
              顧客名を入力して検索するか、空白のまま検索ボタンを押すと全件表示されます。<br />
              案件ごとの「PDF」ボタンで見積書を自動生成できます。
            </div>
          </div>
        )}
      </div>

      <footer style={s.footer}>
        OPTEC · 見積書自動生成システム · Kintone → HTML Template → PDF
      </footer>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--dark)", paddingBottom: 48 },
  header: {
    background: "linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)",
    borderBottom: "1px solid var(--border)",
    padding: "24px 32px 20px",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap",
  },
  badge: {
    display: "inline-block", background: "rgba(201,169,110,0.1)",
    border: "1px solid var(--border)", color: "var(--gold)",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
    padding: "3px 10px", borderRadius: 4, marginBottom: 10, textTransform: "uppercase",
  },
  title:    { fontSize: 24, fontWeight: 700, color: "var(--gold-light)", letterSpacing: "0.04em", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "var(--text-dim)" },
  flowWrap: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", alignSelf: "center" },
  flowStep: { display: "flex", alignItems: "center", gap: 6 },
  flowDot:  { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  flowLabel: { fontSize: 12, color: "var(--text-dim)" },
  flowArrow: { fontSize: 12, color: "var(--border-strong)", marginLeft: 2 },

  body: { display: "flex", flexDirection: "column", gap: 20, padding: "24px 32px" },

  searchCard: {
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24,
    display: "flex", flexDirection: "column", gap: 14,
  },
  resultCard: {
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24,
  },
  cardTitle: { fontSize: 13, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.06em" },
  countBadge: {
    marginLeft: 10, fontSize: 11, background: "rgba(201,169,110,0.12)",
    border: "1px solid var(--border)", color: "var(--gold)",
    padding: "1px 8px", borderRadius: 10,
  },

  searchRow: { display: "flex", gap: 10 },
  searchBtn: {
    background: "rgba(201,169,110,0.15)", border: "1px solid var(--border-strong)",
    color: "var(--gold)", fontSize: 13, padding: "8px 20px",
    borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
    whiteSpace: "nowrap",
  },
  errorBox: {
    padding: "10px 16px", background: "rgba(224,85,85,0.1)",
    border: "1px solid rgba(224,85,85,0.3)", borderRadius: 8,
    color: "#e05555", fontSize: 12,
  },
  empty: { color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: "32px 0" },

  tableWrap: { overflowX: "auto" },
  table:  { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: {
    padding: "10px 12px", textAlign: "left",
    background: "rgba(201,169,110,0.08)", color: "var(--gold)",
    borderBottom: "1px solid var(--border)", fontWeight: 700, whiteSpace: "nowrap",
  },
  td:     { padding: "9px 12px", borderBottom: "1px solid var(--border)", color: "var(--text)", verticalAlign: "middle" },
  trEven: { background: "transparent" },
  trOdd:  { background: "rgba(255,255,255,0.02)" },
  statusBadge: {
    display: "inline-block", fontSize: 11, fontWeight: 700,
    padding: "2px 8px", borderRadius: 4,
  },
  genBtn: {
    background: "rgba(76,175,80,0.15)", border: "1px solid rgba(76,175,80,0.4)",
    color: "#4caf50", fontSize: 11, padding: "5px 12px",
    borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
    whiteSpace: "nowrap",
  },

  hintCard: {
    background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 12,
    padding: "48px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
  },
  hintIcon:  { fontSize: 40, opacity: 0.4 },
  hintTitle: { fontSize: 14, fontWeight: 700, color: "var(--text-dim)" },
  hintDesc:  { fontSize: 12, color: "var(--text-dim)", textAlign: "center", lineHeight: 1.8 },

  footer: {
    textAlign: "center", color: "var(--text-dim)", fontSize: 11,
    letterSpacing: "0.08em", padding: "16px 32px 0",
    borderTop: "1px solid var(--border)", marginTop: 24,
  },
};
