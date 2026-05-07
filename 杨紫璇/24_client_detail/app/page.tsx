"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Client {
  name: string;
  count: number;
  latest: string;
  modes: string[];
}

function modeColor(m: string) {
  if (m === "Export") return "#60a5fa";
  if (m === "Import") return "#f59e0b";
  if (m === "Domestic transport") return "#4caf50";
  return "var(--text-dim)";
}

function fmtDate(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filtered, setFiltered] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/clients")
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setClients(d.clients);
        setFiltered(d.clients);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    setFiltered(q ? clients.filter(c => c.name.toLowerCase().includes(q)) : clients);
  }, [search, clients]);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <div style={s.badge}>OPTEC · KINTONE</div>
          <h1 style={s.title}>客户列表</h1>
          <p style={s.subtitle}>点击客户查看全部案件历史详情</p>
        </div>
        <div style={s.statsBadge}>
          {loading ? "読み込み中…" : `${filtered.length} 件 / 合計 ${clients.reduce((s, c) => s + c.count, 0)} 案件`}
        </div>
      </header>

      <div style={s.toolbar}>
        <input
          style={s.searchInput}
          placeholder="🔍 顧客名で検索…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && <div style={s.errorBox}>⚠ {error}</div>}

      {loading ? (
        <div style={s.center}>データ取得中…</div>
      ) : (
        <div style={s.grid}>
          {filtered.map(c => (
            <Link
              key={c.name}
              href={`/clients/${encodeURIComponent(c.name)}`}
              style={{ textDecoration: "none" }}
            >
              <div style={s.card}>
                <div style={s.cardTop}>
                  <span style={s.avatar}>{c.name.slice(0, 1)}</span>
                  <div style={s.cardInfo}>
                    <div style={s.clientName}>{c.name}</div>
                    <div style={s.clientSub}>最終登録: {fmtDate(c.latest)}</div>
                  </div>
                </div>
                <div style={s.cardBottom}>
                  <span style={s.countBadge}>📦 {c.count} 案件</span>
                  <div style={s.modes}>
                    {c.modes.map(m => (
                      <span key={m} style={{ ...s.modeTag, color: modeColor(m), borderColor: `${modeColor(m)}55` }}>
                        {m === "Domestic transport" ? "Dom." : m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div style={s.center}>該当する顧客が見つかりません</div>
          )}
        </div>
      )}

      <footer style={s.footer}>OPTEC · 客户列表 · Powered by Kintone REST API</footer>
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
  title: { fontSize: 24, fontWeight: 700, color: "var(--gold-light)", letterSpacing: "0.04em", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "var(--text-dim)" },
  statsBadge: {
    fontSize: 12, color: "var(--gold)", background: "rgba(201,169,110,0.1)",
    border: "1px solid var(--border)", padding: "6px 16px", borderRadius: 20, alignSelf: "center",
  },
  toolbar: { padding: "14px 32px", background: "var(--dark2)", borderBottom: "1px solid var(--border)" },
  searchInput: {
    width: "100%", maxWidth: 400, padding: "8px 14px",
    background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
    borderRadius: 8, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none",
  },
  errorBox: {
    margin: "12px 32px", padding: "10px 16px",
    background: "rgba(224,85,85,0.1)", border: "1px solid rgba(224,85,85,0.3)",
    borderRadius: 8, color: "#e05555", fontSize: 12,
  },
  center: { textAlign: "center", padding: "60px 32px", color: "var(--text-dim)", fontSize: 14 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16, padding: "24px 32px",
  },
  card: {
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12,
    padding: "18px 20px", cursor: "pointer", transition: "border-color 0.2s, transform 0.15s",
    display: "flex", flexDirection: "column", gap: 12,
  },
  cardTop: { display: "flex", gap: 12, alignItems: "flex-start" },
  avatar: {
    width: 40, height: 40, borderRadius: "50%",
    background: "rgba(201,169,110,0.15)", border: "1px solid var(--border-strong)",
    color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, fontWeight: 700, flexShrink: 0,
    lineHeight: "40px", textAlign: "center",
  },
  cardInfo: { flex: 1, minWidth: 0 },
  clientName: {
    fontSize: 13, fontWeight: 700, color: "var(--text)",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    marginBottom: 3,
  },
  clientSub: { fontSize: 11, color: "var(--text-dim)" },
  cardBottom: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  countBadge: {
    fontSize: 11, color: "var(--gold)", background: "rgba(201,169,110,0.1)",
    border: "1px solid var(--border)", padding: "2px 10px", borderRadius: 12,
  },
  modes: { display: "flex", gap: 4, flexWrap: "wrap" },
  modeTag: {
    fontSize: 10, padding: "1px 6px", borderRadius: 4,
    border: "1px solid", fontWeight: 700,
  },
  footer: {
    textAlign: "center", color: "var(--text-dim)", fontSize: 11,
    letterSpacing: "0.08em", padding: "16px 32px 0",
    borderTop: "1px solid var(--border)", marginTop: 20,
  },
};
