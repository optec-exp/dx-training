"use client";

import { useState, useEffect, useCallback } from "react";

const COURSES = [
  { id: "dgr", label: "DGR\n危险品" },
  { id: "temp", label: "温度管理\n冷链规范" },
  { id: "iso", label: "ISO内审\n内部审核" },
  { id: "customs", label: "通关规范\n报关流程" },
  { id: "safety", label: "安全操作\n作业规程" },
  { id: "customer", label: "客户服务\n投诉处理" },
  { id: "ncr", label: "NCR处理\n纠正措施" },
  { id: "iata", label: "IATA规范\n航空货运" },
];

const EMPLOYEES = [
  { id: "e1", name: "张伟", dept: "品质部" },
  { id: "e2", name: "李静", dept: "品质部" },
  { id: "e3", name: "王磊", dept: "操作部" },
  { id: "e4", name: "陈晓燕", dept: "操作部" },
  { id: "e5", name: "刘建国", dept: "客服部" },
  { id: "e6", name: "赵敏", dept: "客服部" },
  { id: "e7", name: "孙浩", dept: "报关部" },
  { id: "e8", name: "周雯", dept: "报关部" },
];

type Matrix = Record<string, Record<string, boolean>>;

const STORAGE_KEY = "optec-training-matrix-v1";

function buildDefault(): Matrix {
  const m: Matrix = {};
  for (const emp of EMPLOYEES) {
    m[emp.id] = {};
    for (const c of COURSES) {
      m[emp.id][c.id] = false;
    }
  }
  return m;
}

export default function TrainingMatrix() {
  const [matrix, setMatrix] = useState<Matrix>(buildDefault);
  const [highlight, setHighlight] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMatrix(JSON.parse(saved));
    } catch {}
  }, []);

  const save = useCallback((m: Matrix) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
    setLastUpdated(new Date().toLocaleString("zh-CN"));
  }, []);

  const toggle = (empId: string, courseId: string) => {
    setMatrix((prev) => {
      const next = { ...prev, [empId]: { ...prev[empId], [courseId]: !prev[empId][courseId] } };
      save(next);
      return next;
    });
  };

  const resetAll = () => {
    const fresh = buildDefault();
    setMatrix(fresh);
    save(fresh);
  };

  const totalCells = EMPLOYEES.length * COURSES.length;
  const completedCells = EMPLOYEES.reduce(
    (sum, emp) => sum + COURSES.filter((c) => matrix[emp.id]?.[c.id]).length,
    0
  );
  const coverageRate = Math.round((completedCells / totalCells) * 100);

  const empCompletion = (empId: string) => {
    const done = COURSES.filter((c) => matrix[empId]?.[c.id]).length;
    return { done, total: COURSES.length, pct: Math.round((done / COURSES.length) * 100) };
  };

  const courseCompletion = (courseId: string) => {
    const done = EMPLOYEES.filter((e) => matrix[e.id]?.[courseId]).length;
    return { done, total: EMPLOYEES.length, pct: Math.round((done / EMPLOYEES.length) * 100) };
  };

  const coverageColor =
    coverageRate >= 80 ? "#4caf50" : coverageRate >= 50 ? "#f59e0b" : "#e05555";

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.badge}>OPTEC · 品质管理</div>
          <h1 style={styles.title}>员工品质培训记录管理</h1>
          <p style={styles.subtitle}>谁完成了哪些培训课程 · 矩阵清单 · 实时进度追踪</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.coverageRing}>
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(201,169,110,0.15)" strokeWidth="8" />
              <circle
                cx="45" cy="45" r="38"
                fill="none"
                stroke={coverageColor}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 38 * coverageRate / 100} ${2 * Math.PI * 38 * (1 - coverageRate / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 45 45)"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            </svg>
            <div style={styles.coverageText}>
              <span style={{ ...styles.coveragePct, color: coverageColor }}>{coverageRate}%</span>
              <span style={styles.coverageLabel}>整体覆盖率</span>
            </div>
          </div>
          <div style={styles.statGrid}>
            <Stat label="已完成" value={`${completedCells}`} color="#4caf50" />
            <Stat label="待完成" value={`${totalCells - completedCells}`} color="#e05555" />
            <Stat label="培训项目" value={`${COURSES.length}`} color="#c9a96e" />
            <Stat label="员工人数" value={`${EMPLOYEES.length}`} color="#c9a96e" />
          </div>
        </div>
      </header>

      {/* ── Toolbar ── */}
      <div style={styles.toolbar}>
        <label style={styles.toggle}>
          <input
            type="checkbox"
            checked={highlight}
            onChange={(e) => setHighlight(e.target.checked)}
            style={{ accentColor: "#c9a96e", width: 16, height: 16, cursor: "pointer" }}
          />
          <span>高亮未完成项</span>
        </label>
        {lastUpdated && (
          <span style={styles.lastUpdated}>最后更新：{lastUpdated}</span>
        )}
        <button style={styles.resetBtn} onClick={resetAll}>
          重置全部数据
        </button>
      </div>

      {/* ── Matrix Table ── */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, ...styles.thFixed }}>
                <span style={styles.empHeader}>员工 / 培训课程</span>
              </th>
              {COURSES.map((c) => {
                const cc = courseCompletion(c.id);
                return (
                  <th key={c.id} style={styles.th}>
                    <div style={styles.courseLabel}>
                      {c.label.split("\n").map((line, i) => (
                        <span key={i} style={i === 1 ? styles.courseSub : styles.courseMain}>
                          {line}
                        </span>
                      ))}
                    </div>
                    <div style={styles.courseBar}>
                      <div
                        style={{
                          ...styles.courseBarFill,
                          width: `${cc.pct}%`,
                          background: cc.pct >= 80 ? "#4caf50" : cc.pct >= 50 ? "#f59e0b" : "#e05555",
                        }}
                      />
                    </div>
                    <span style={styles.courseBarLabel}>{cc.done}/{cc.total}</span>
                  </th>
                );
              })}
              <th style={{ ...styles.th, minWidth: 160 }}>
                <span style={styles.empHeader}>完成率</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {EMPLOYEES.map((emp, ri) => {
              const ec = empCompletion(emp.id);
              const rowBg = ri % 2 === 0 ? "var(--card)" : "var(--card2)";
              return (
                <tr key={emp.id} style={{ background: rowBg }}>
                  <td style={{ ...styles.td, ...styles.tdFixed, background: rowBg }}>
                    <div style={styles.empCell}>
                      <span style={styles.empName}>{emp.name}</span>
                      <span style={styles.empDept}>{emp.dept}</span>
                    </div>
                  </td>
                  {COURSES.map((c) => {
                    const done = matrix[emp.id]?.[c.id] ?? false;
                    const isIncomplete = highlight && !done;
                    return (
                      <td
                        key={c.id}
                        style={{
                          ...styles.td,
                          background: done
                            ? "rgba(76,175,80,0.08)"
                            : isIncomplete
                            ? "rgba(224,85,85,0.07)"
                            : rowBg,
                          borderColor: done
                            ? "rgba(76,175,80,0.2)"
                            : isIncomplete
                            ? "rgba(224,85,85,0.2)"
                            : "var(--border)",
                        }}
                        onClick={() => toggle(emp.id, c.id)}
                      >
                        <div style={styles.checkCell}>
                          <div
                            style={{
                              ...styles.checkBox,
                              background: done ? "#4caf50" : "transparent",
                              borderColor: done ? "#4caf50" : isIncomplete ? "#e05555" : "var(--border-strong)",
                            }}
                          >
                            {done && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  <td style={{ ...styles.td, minWidth: 160 }}>
                    <ProgressBar pct={ec.pct} done={ec.done} total={ec.total} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "var(--dark2)" }}>
              <td style={{ ...styles.td, ...styles.tdFixed, background: "var(--dark2)" }}>
                <span style={{ color: "var(--gold)", fontSize: 12, fontWeight: 700 }}>各课程完成率</span>
              </td>
              {COURSES.map((c) => {
                const cc = courseCompletion(c.id);
                return (
                  <td key={c.id} style={styles.td}>
                    <ProgressBar pct={cc.pct} done={cc.done} total={cc.total} compact />
                  </td>
                );
              })}
              <td style={{ ...styles.td, minWidth: 160 }}>
                <ProgressBar pct={coverageRate} done={completedCells} total={totalCells} label="整体" />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Legend ── */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, background: "#4caf50" }} />
          <span>已完成</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, background: "#e05555" }} />
          <span>未完成（点击勾选）</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, background: "#f59e0b" }} />
          <span>完成率 50–79%</span>
        </div>
        <span style={styles.hint}>点击任意格子可切换完成状态 · 数据自动保存至本地</span>
      </div>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        OPTEC · 员工品质培训记录管理系统 · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={styles.statItem}>
      <span style={{ ...styles.statValue, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

function ProgressBar({
  pct, done, total, compact, label,
}: {
  pct: number; done: number; total: number; compact?: boolean; label?: string;
}) {
  const color = pct >= 80 ? "#4caf50" : pct >= 50 ? "#f59e0b" : "#e05555";
  return (
    <div style={{ padding: compact ? "4px 8px" : "4px 12px" }}>
      {!compact && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{label ?? `${done}/${total}`}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%</span>
        </div>
      )}
      <div style={styles.barTrack}>
        <div
          style={{
            ...styles.barFill,
            width: `${pct}%`,
            background: color,
          }}
        />
      </div>
      {compact && (
        <span style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2, display: "block", textAlign: "center" }}>
          {pct}%
        </span>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "var(--dark)",
    paddingBottom: 40,
  },
  header: {
    background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)",
    borderBottom: "1px solid var(--border)",
    padding: "28px 32px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 24,
    flexWrap: "wrap",
  },
  headerLeft: { flex: 1, minWidth: 260 },
  badge: {
    display: "inline-block",
    background: "rgba(201,169,110,0.12)",
    border: "1px solid var(--border)",
    color: "var(--gold)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    padding: "3px 10px",
    borderRadius: 4,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: "var(--gold-light)",
    letterSpacing: "0.04em",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "var(--text-dim)",
    letterSpacing: "0.05em",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    flexWrap: "wrap",
  },
  coverageRing: {
    position: "relative",
    width: 90,
    height: 90,
  },
  coverageText: {
    position: "absolute",
    top: 0, left: 0,
    width: "100%", height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  coveragePct: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1,
  },
  coverageLabel: {
    fontSize: 9,
    color: "var(--text-dim)",
    marginTop: 2,
    letterSpacing: "0.05em",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "rgba(201,169,110,0.06)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "8px 16px",
    minWidth: 72,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 10,
    color: "var(--text-dim)",
    marginTop: 3,
    letterSpacing: "0.06em",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    padding: "12px 32px",
    background: "var(--dark2)",
    borderBottom: "1px solid var(--border)",
    flexWrap: "wrap",
  },
  toggle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "var(--text-dim)",
    fontSize: 13,
    cursor: "pointer",
    userSelect: "none",
  },
  lastUpdated: {
    fontSize: 12,
    color: "var(--text-dim)",
    flex: 1,
  },
  resetBtn: {
    background: "transparent",
    border: "1px solid rgba(224,85,85,0.4)",
    color: "#e05555",
    fontSize: 12,
    padding: "5px 14px",
    borderRadius: 6,
    cursor: "pointer",
    letterSpacing: "0.04em",
    transition: "all 0.2s",
  },
  tableWrap: {
    overflowX: "auto",
    margin: "24px 32px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--card)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "auto",
  },
  th: {
    padding: "12px 8px",
    background: "var(--dark2)",
    borderBottom: "2px solid var(--border-strong)",
    borderRight: "1px solid var(--border)",
    textAlign: "center",
    verticalAlign: "bottom",
    minWidth: 88,
  },
  thFixed: {
    position: "sticky",
    left: 0,
    zIndex: 2,
    minWidth: 140,
    textAlign: "left",
    paddingLeft: 16,
    background: "var(--dark2)",
    boxShadow: "2px 0 8px rgba(0,0,0,0.3)",
  },
  empHeader: {
    fontSize: 12,
    color: "var(--gold)",
    fontWeight: 700,
    letterSpacing: "0.06em",
  },
  courseLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    marginBottom: 6,
  },
  courseMain: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--gold-light)",
    letterSpacing: "0.04em",
  },
  courseSub: {
    fontSize: 10,
    color: "var(--text-dim)",
    letterSpacing: "0.03em",
  },
  courseBar: {
    height: 3,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    overflow: "hidden",
    margin: "0 8px 3px",
  },
  courseBarFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 0.4s ease",
  },
  courseBarLabel: {
    fontSize: 10,
    color: "var(--text-dim)",
  },
  td: {
    padding: 0,
    borderRight: "1px solid var(--border)",
    borderBottom: "1px solid var(--border)",
    textAlign: "center",
    verticalAlign: "middle",
    transition: "background 0.2s",
  },
  tdFixed: {
    position: "sticky",
    left: 0,
    zIndex: 1,
    boxShadow: "2px 0 8px rgba(0,0,0,0.25)",
    padding: "10px 16px",
    textAlign: "left",
  },
  empCell: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  empName: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text)",
  },
  empDept: {
    fontSize: 10,
    color: "var(--text-dim)",
    letterSpacing: "0.05em",
  },
  checkCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 0",
    cursor: "pointer",
  },
  checkBox: {
    width: 22,
    height: 22,
    border: "2px solid",
    borderRadius: 5,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.18s ease",
    flexShrink: 0,
  },
  barTrack: {
    height: 6,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.4s ease",
  },
  legend: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    padding: "0 32px 16px",
    flexWrap: "wrap",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "var(--text-dim)",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    flexShrink: 0,
  },
  hint: {
    fontSize: 11,
    color: "rgba(232,224,208,0.35)",
    marginLeft: "auto",
  },
  footer: {
    textAlign: "center",
    color: "var(--text-dim)",
    fontSize: 11,
    letterSpacing: "0.1em",
    padding: "16px 32px 0",
    borderTop: "1px solid var(--border)",
    marginTop: 8,
  },
};
