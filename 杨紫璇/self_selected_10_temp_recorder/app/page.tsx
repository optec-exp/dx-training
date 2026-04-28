"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TempRecord {
  id: string;
  awb: string;
  cargo: string;
  tempMin: number;
  tempMax: number;
  actual: number;
  location: string;
  timestamp: string;
  exceeded: boolean;
  deviation: number; // positive = above max, negative = below min, 0 = normal
}

type TimeFilter = "all" | "month" | "week";
type StatusFilter = "all" | "exceeded" | "normal";

const STORAGE_KEY = "optec-temp-records-v1";

function calcDeviation(actual: number, min: number, max: number) {
  if (actual > max) return +(actual - max);
  if (actual < min) return -(min - actual);
  return 0;
}

function nowISO() {
  return new Date().toISOString();
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function isThisMonth(iso: string) {
  const d = new Date(iso), now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function isThisWeek(iso: string) {
  const d = new Date(iso), now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  return d >= weekAgo;
}

const DEMO: TempRecord[] = [
  { id: "d1", awb: "176-11223344", cargo: "疫苗原液", tempMin: 2, tempMax: 8, actual: 11.2, location: "浦东机场仓库", timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), exceeded: true, deviation: 3.2 },
  { id: "d2", awb: "176-55667788", cargo: "血清制品", tempMin: -20, tempMax: -15, actual: -18.5, location: "冷链转运站", timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), exceeded: false, deviation: 0 },
  { id: "d3", awb: "176-99001122", cargo: "胰岛素", tempMin: 2, tempMax: 8, actual: 1.1, location: "香港清关仓", timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), exceeded: true, deviation: -0.9 },
  { id: "d4", awb: "176-33445566", cargo: "活体组织", tempMin: 4, tempMax: 6, actual: 5.2, location: "成田空港", timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), exceeded: false, deviation: 0 },
  { id: "d5", awb: "176-77889900", cargo: "冷冻血浆", tempMin: -30, tempMax: -18, actual: -12.0, location: "关西国际空港", timestamp: new Date(Date.now() - 6 * 86400000).toISOString(), exceeded: true, deviation: 6.0 },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TempRecorder() {
  const [records, setRecords] = useState<TempRecord[]>([]);
  const [form, setForm] = useState({ awb: "", cargo: "", tempMin: "", tempMax: "", actual: "", location: "" });
  const [preview, setPreview] = useState<{ exceeded: boolean; deviation: number } | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setRecords(saved ? JSON.parse(saved) : DEMO);
    } catch { setRecords(DEMO); }
  }, []);

  const save = (r: TempRecord[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
    setRecords(r);
  };

  // live preview while typing actual temp
  useEffect(() => {
    const { tempMin, tempMax, actual } = form;
    if (tempMin !== "" && tempMax !== "" && actual !== "") {
      const dev = calcDeviation(parseFloat(actual), parseFloat(tempMin), parseFloat(tempMax));
      setPreview({ exceeded: dev !== 0, deviation: dev });
    } else {
      setPreview(null);
    }
  }, [form.actual, form.tempMin, form.tempMax]);

  const setF = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const isValid = form.awb && form.cargo && form.tempMin !== "" && form.tempMax !== "" &&
                  form.actual !== "" && form.location;

  const submit = () => {
    if (!isValid) return;
    const min = parseFloat(form.tempMin), max = parseFloat(form.tempMax), actual = parseFloat(form.actual);
    const dev = calcDeviation(actual, min, max);
    const rec: TempRecord = {
      id: Date.now().toString(),
      awb: form.awb, cargo: form.cargo,
      tempMin: min, tempMax: max, actual,
      location: form.location,
      timestamp: nowISO(),
      exceeded: dev !== 0, deviation: dev,
    };
    save([rec, ...records]);
    setForm({ awb: "", cargo: "", tempMin: "", tempMax: "", actual: "", location: "" });
    setPreview(null);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  const deleteRecord = (id: string) => save(records.filter(r => r.id !== id));

  // ─── Filtered records
  const filtered = records.filter(r => {
    const timeOk = timeFilter === "all" ? true : timeFilter === "month" ? isThisMonth(r.timestamp) : isThisWeek(r.timestamp);
    const statusOk = statusFilter === "all" ? true : statusFilter === "exceeded" ? r.exceeded : !r.exceeded;
    return timeOk && statusOk;
  });

  // ─── Stats (always based on this month)
  const monthRecords = records.filter(r => isThisMonth(r.timestamp));
  const monthTotal = monthRecords.length;
  const monthExceeded = monthRecords.filter(r => r.exceeded).length;
  const monthRate = monthTotal ? Math.round((monthExceeded / monthTotal) * 100) : 0;
  const allExceeded = records.filter(r => r.exceeded).length;

  // ─── Chart data: last 8 records
  const chartData = records.slice(0, 8).reverse();
  const chartMax = Math.max(...chartData.map(r => Math.abs(r.deviation)), 1);

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <div style={s.badge}>OPTEC · 冷链品质</div>
          <h1 style={s.title}>温度管理异常记录器</h1>
          <p style={s.subtitle}>冷链货物温度超标快速记录与分析 · 自动判定 · 实时统计</p>
        </div>
        <div style={s.headerTags}>
          {["输入+图表", "filter", "统计"].map(t => (
            <span key={t} style={s.tag}>{t}</span>
          ))}
        </div>
      </header>

      <div style={s.body}>
        {/* ── Left: Form + Stats ── */}
        <div style={s.leftCol}>
          {/* Stats cards */}
          <div style={s.statsRow}>
            <StatCard label="本月记录" value={monthTotal} color="var(--gold)" />
            <StatCard label="本月超标" value={monthExceeded} color="var(--red)" />
            <StatCard label="本月超标率" value={`${monthRate}%`} color={monthRate >= 30 ? "var(--red)" : monthRate >= 10 ? "var(--amber)" : "var(--green)"} />
            <StatCard label="累计超标" value={allExceeded} color="var(--text-dim)" />
          </div>

          {/* Entry form */}
          <div style={s.card}>
            <div style={s.cardTitle}>快速录入</div>
            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>AWB 提单号 <Req /></label>
                <input value={form.awb} onChange={e => setF("awb", e.target.value)} placeholder="例：176-12345678" />
              </div>
              <div style={s.field}>
                <label style={s.label}>货物品名 <Req /></label>
                <input value={form.cargo} onChange={e => setF("cargo", e.target.value)} placeholder="例：疫苗原液" />
              </div>
              <div style={s.field}>
                <label style={s.label}>要求温度下限 (°C) <Req /></label>
                <input type="number" step="0.1" value={form.tempMin} onChange={e => setF("tempMin", e.target.value)} placeholder="例：2" />
              </div>
              <div style={s.field}>
                <label style={s.label}>要求温度上限 (°C) <Req /></label>
                <input type="number" step="0.1" value={form.tempMax} onChange={e => setF("tempMax", e.target.value)} placeholder="例：8" />
              </div>
              <div style={{ ...s.field, position: "relative" }}>
                <label style={s.label}>实测温度 (°C) <Req /></label>
                <input type="number" step="0.1" value={form.actual} onChange={e => setF("actual", e.target.value)} placeholder="例：11.2"
                  style={{ borderColor: preview ? (preview.exceeded ? "var(--red)" : "var(--green)") : undefined }} />
                {preview && (
                  <div style={{ ...s.previewBadge, background: preview.exceeded ? "var(--red-dim)" : "var(--green-dim)", borderColor: preview.exceeded ? "rgba(224,85,85,0.4)" : "rgba(76,175,80,0.4)", color: preview.exceeded ? "var(--red)" : "var(--green)" }}>
                    {preview.exceeded
                      ? `超标 ${preview.deviation > 0 ? "+" : ""}${preview.deviation.toFixed(1)}°C`
                      : "✓ 正常范围"}
                  </div>
                )}
              </div>
              <div style={s.field}>
                <label style={s.label}>发现地点 <Req /></label>
                <input value={form.location} onChange={e => setF("location", e.target.value)} placeholder="例：浦东机场仓库" />
              </div>
            </div>
            <button style={{ ...s.submitBtn, opacity: isValid ? 1 : 0.4, cursor: isValid ? "pointer" : "not-allowed" }}
              onClick={submit} disabled={!isValid}>
              {submitted ? "✓ 已记录" : "提交记录"}
            </button>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div style={s.card}>
              <div style={s.cardTitle}>温度偏差图（最近 {chartData.length} 条）</div>
              <div style={s.chartWrap}>
                {chartData.map((r, i) => {
                  const pct = Math.abs(r.deviation) / chartMax;
                  const h = Math.max(4, Math.round(pct * 80));
                  return (
                    <div key={r.id} style={s.chartCol}>
                      <div style={s.barWrap}>
                        <div style={{ ...s.bar, height: h, background: r.exceeded ? "var(--red)" : "var(--green)", opacity: 0.85 }} title={`${r.cargo}\n偏差: ${r.deviation > 0 ? "+" : ""}${r.deviation.toFixed(1)}°C`} />
                      </div>
                      <div style={s.barLabel}>{r.exceeded ? `${r.deviation > 0 ? "+" : ""}${r.deviation.toFixed(1)}` : "✓"}</div>
                      <div style={s.barDate}>{fmtDateTime(r.timestamp).slice(0, 5)}</div>
                    </div>
                  );
                })}
              </div>
              <div style={s.chartLegend}>
                <span><span style={{ ...s.dot, background: "var(--red)" }} />超标</span>
                <span><span style={{ ...s.dot, background: "var(--green)" }} />正常</span>
                <span style={{ color: "var(--text-dim)", fontSize: 10 }}>纵轴 = 偏差幅度 (°C)</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: History list ── */}
        <div style={s.rightCol}>
          <div style={s.card}>
            <div style={s.listHeader}>
              <div style={s.cardTitle}>历史记录</div>
              <div style={s.filters}>
                <FilterBtn label="全部" active={timeFilter === "all"} onClick={() => setTimeFilter("all")} />
                <FilterBtn label="本月" active={timeFilter === "month"} onClick={() => setTimeFilter("month")} />
                <FilterBtn label="本周" active={timeFilter === "week"} onClick={() => setTimeFilter("week")} />
                <div style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
                <FilterBtn label="全部" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
                <FilterBtn label="超标" active={statusFilter === "exceeded"} onClick={() => setStatusFilter("exceeded")} color="var(--red)" />
                <FilterBtn label="正常" active={statusFilter === "normal"} onClick={() => setStatusFilter("normal")} color="var(--green)" />
              </div>
            </div>

            <div style={s.listCount}>共 {filtered.length} 条记录</div>

            {filtered.length === 0 ? (
              <div style={s.empty}>暂无符合条件的记录</div>
            ) : (
              <div style={s.list}>
                {filtered.map(r => (
                  <div key={r.id} style={{ ...s.listItem, borderLeft: `3px solid ${r.exceeded ? "var(--red)" : "var(--green)"}` }}>
                    <div style={s.itemTop}>
                      <div style={s.itemLeft}>
                        <span style={{ ...s.statusBadge, background: r.exceeded ? "var(--red-dim)" : "var(--green-dim)", color: r.exceeded ? "var(--red)" : "var(--green)", borderColor: r.exceeded ? "rgba(224,85,85,0.35)" : "rgba(76,175,80,0.35)" }}>
                          {r.exceeded
                            ? `超标 ${r.deviation > 0 ? "+" : ""}${r.deviation.toFixed(1)}°C`
                            : "正常"}
                        </span>
                        <span style={s.cargoName}>{r.cargo}</span>
                      </div>
                      <button style={s.delBtn} onClick={() => deleteRecord(r.id)}>✕</button>
                    </div>
                    <div style={s.itemMeta}>
                      <span>AWB: {r.awb}</span>
                      <span>实测 <strong style={{ color: r.exceeded ? "var(--red)" : "var(--green)" }}>{r.actual}°C</strong></span>
                      <span>要求 {r.tempMin}~{r.tempMax}°C</span>
                      <span>{r.location}</span>
                      <span style={{ color: "var(--text-dim)" }}>{fmtDateTime(r.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer style={s.footer}>
        OPTEC · 温度管理异常记录器 · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Req() {
  return <span style={{ color: "var(--red)", marginLeft: 2 }}>*</span>;
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={s.statCard}>
      <span style={{ ...s.statValue, color }}>{value}</span>
      <span style={s.statLabel}>{label}</span>
    </div>
  );
}

function FilterBtn({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} style={{
      ...s.filterBtn,
      background: active ? (color ? `${color}22` : "rgba(201,169,110,0.15)") : "transparent",
      borderColor: active ? (color ?? "var(--gold)") : "var(--border)",
      color: active ? (color ?? "var(--gold)") : "var(--text-dim)",
    }}>{label}</button>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--dark)", paddingBottom: 40 },

  header: {
    background: "linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)",
    borderBottom: "1px solid var(--border)",
    padding: "26px 32px 20px",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap",
  },
  badge: {
    display: "inline-block", background: "rgba(201,169,110,0.1)",
    border: "1px solid var(--border)", color: "var(--gold)",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
    padding: "3px 10px", borderRadius: 4, marginBottom: 10, textTransform: "uppercase",
  },
  title: { fontSize: 23, fontWeight: 700, color: "var(--gold-light)", letterSpacing: "0.04em", marginBottom: 5 },
  subtitle: { fontSize: 12, color: "var(--text-dim)", letterSpacing: "0.04em" },
  headerTags: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  tag: {
    background: "rgba(201,169,110,0.08)", border: "1px solid var(--border)",
    color: "var(--gold)", fontSize: 11, padding: "4px 12px", borderRadius: 12,
  },

  body: {
    display: "grid", gridTemplateColumns: "380px 1fr",
    gap: 20, padding: "20px 32px", alignItems: "start",
  },
  leftCol: { display: "flex", flexDirection: "column", gap: 16 },
  rightCol: { display: "flex", flexDirection: "column", gap: 16 },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 },
  statCard: {
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10,
    padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.05em" },

  card: {
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12,
    padding: "18px 20px", boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
  },
  cardTitle: {
    fontSize: 13, fontWeight: 700, color: "var(--gold-light)",
    letterSpacing: "0.06em", marginBottom: 14,
  },

  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 14px", marginBottom: 16 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 11, color: "var(--text-dim)", fontWeight: 600, letterSpacing: "0.05em" },
  previewBadge: {
    position: "absolute", right: 0, top: 0,
    fontSize: 10, fontWeight: 700, padding: "2px 8px",
    borderRadius: 5, border: "1px solid", letterSpacing: "0.04em",
  },
  submitBtn: {
    width: "100%", background: "linear-gradient(135deg,var(--gold) 0%,#b8892a 100%)",
    color: "#08080f", border: "none", borderRadius: 8,
    padding: "10px", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em",
    transition: "opacity 0.2s",
  },

  chartWrap: { display: "flex", gap: 6, alignItems: "flex-end", height: 100, padding: "0 4px" },
  chartCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  barWrap: { display: "flex", alignItems: "flex-end", height: 80, width: "100%" },
  bar: { width: "100%", borderRadius: "3px 3px 0 0", transition: "height 0.3s ease" },
  barLabel: { fontSize: 9, color: "var(--text-dim)", letterSpacing: 0 },
  barDate: { fontSize: 8, color: "rgba(232,224,208,0.3)" },
  chartLegend: { display: "flex", gap: 14, marginTop: 10, fontSize: 11, color: "var(--text-dim)", alignItems: "center" },
  dot: { display: "inline-block", width: 8, height: 8, borderRadius: "50%", marginRight: 4 },

  listHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 },
  filters: { display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" },
  filterBtn: {
    fontSize: 11, padding: "4px 10px", borderRadius: 6,
    border: "1px solid", cursor: "pointer", fontFamily: "inherit",
    transition: "all 0.15s", letterSpacing: "0.04em",
  },
  listCount: { fontSize: 11, color: "var(--text-dim)", marginBottom: 10 },
  empty: { textAlign: "center", color: "var(--text-dim)", padding: "32px 0", fontSize: 13 },
  list: { display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflowY: "auto" },
  listItem: {
    background: "var(--card2)", borderRadius: 8,
    padding: "10px 14px",
    border: "1px solid var(--border)",
  },
  itemTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  itemLeft: { display: "flex", alignItems: "center", gap: 8 },
  statusBadge: {
    fontSize: 11, fontWeight: 700, padding: "2px 8px",
    borderRadius: 5, border: "1px solid", letterSpacing: "0.04em",
  },
  cargoName: { fontSize: 13, fontWeight: 700, color: "var(--text)" },
  itemMeta: { display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11, color: "var(--text-dim)" },
  delBtn: {
    background: "transparent", border: "none", color: "rgba(224,85,85,0.4)",
    cursor: "pointer", fontSize: 12, padding: "2px 4px", lineHeight: 1,
  },

  footer: {
    textAlign: "center", color: "var(--text-dim)", fontSize: 11,
    letterSpacing: "0.1em", padding: "16px 32px 0",
    borderTop: "1px solid var(--border)", marginTop: 8,
  },
};
