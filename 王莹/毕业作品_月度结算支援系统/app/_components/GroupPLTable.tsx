"use client";

import { useState, Fragment } from "react";

interface M3 { 毛利: number; 贩管费: number; 净利: number }
interface Row { 小组: string; 毛利: number; 贩管费: number; 净利: number }
interface Budget { 毛利: number | null; 贩管费: number | null; 净利: number | null }
interface Mgmt { 部门: string; 贩管费: number; 地域: "中国" | "日本" }
interface BizFY { 小组: string; act: M3; bud: Budget }
interface MgmtFY { 部门: string; 实绩: number; 预算: number | null; 地域: "中国" | "日本" }
const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");
const METRICS = ["毛利", "贩管费", "净利"] as const;

// 全年累计达成 子弹条
function bullet(label: string, actual: number, budget: number | null, mode: "higher" | "neutral" = "higher") {
  const rate = budget ? actual / budget : null;
  const fillW = rate == null ? 0 : Math.min(100, Math.max(0, rate * 100));
  const color = rate == null ? "var(--border)" : mode === "neutral" ? "var(--accent)" : rate >= 1 ? "var(--green)" : "var(--amber)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
      <div style={{ width: 48, fontSize: 12, color: "var(--text)" }}>{label}</div>
      <div style={{ flex: 1, minWidth: 60, height: 14, background: "var(--panel-2)", borderRadius: 7, overflow: "hidden" }}><div style={{ width: `${fillW}%`, height: "100%", background: color, borderRadius: 7 }} /></div>
      <div style={{ width: 200, fontSize: 11, color: "var(--muted)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>累计 {yen(actual)} / 全年 {budget == null ? "—" : yen(budget)}{rate != null && <b style={{ color, marginLeft: 4 }}>{(rate * 100).toFixed(0)}%</b>}</div>
    </div>
  );
}

export default function GroupPLTable({ business, budgets, mgmt, mgmtBudgets, bizFY, mgmtFY }: {
  business: Row[]; budgets: Record<string, Budget>; mgmt: Mgmt[]; mgmtBudgets: Record<string, number | null>; bizFY: BizFY[]; mgmtFY: MgmtFY[];
}) {
  const [open, setOpen] = useState(false);
  const jp = business.filter((b) => b.小组.startsWith("JP DESK"));
  const jpMerged: Row = { 小组: "JP DESK", 毛利: jp.reduce((s, b) => s + b.毛利, 0), 贩管费: jp.reduce((s, b) => s + b.贩管费, 0), 净利: jp.reduce((s, b) => s + b.净利, 0) };
  const jpBudget: Budget = Object.fromEntries(METRICS.map((m) => {
    const own = budgets["JP DESK"]?.[m]; if (own != null) return [m, own];
    const any = jp.some((c) => budgets[c.小组]?.[m] != null);
    return [m, any ? jp.reduce((s, c) => s + (budgets[c.小组]?.[m] || 0), 0) : null];
  })) as Budget;

  const renderGroup = (r: Row, bud: Budget | undefined, opts?: { expandable?: boolean; child?: boolean; onClick?: () => void }) =>
    METRICS.map((项, i) => {
      const a = r[项], b = bud?.[项] ?? null;
      return (
        <tr key={r.小组 + 项} onClick={i === 0 ? opts?.onClick : undefined}
          style={{ cursor: opts?.expandable && i === 0 ? "pointer" : undefined, borderTop: i === 0 && !opts?.child ? "2px solid var(--border)" : undefined, background: opts?.child ? "var(--panel-2)" : undefined }}>
          <td style={{ paddingLeft: opts?.child ? 28 : undefined, color: i === 0 ? (opts?.child ? "var(--muted)" : "var(--text)") : "transparent" }}>
            {i === 0 ? <>{opts?.expandable && <span style={{ color: "var(--accent)", marginRight: 6 }}>{open ? "▾" : "▸"}</span>}{r.小组}</> : "·"}
          </td>
          <td>{项}</td>
          <td className={"num" + (项 === "净利" ? " strong" : "")}>{yen(a)}</td>
          <td className="num">{b == null ? "—" : yen(b)}</td>
          <td className={"num" + (b != null && a - b < 0 ? " neg" : "")}>{b == null ? "—" : yen(a - b)}</td>
          <td className="num">{b ? ((a / b) * 100).toFixed(0) + "%" : "—"}</td>
        </tr>
      );
    });

  return (
    <>
      {/* 业务部门 P&L + 全年累计达成（右侧空白） */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        <table className="report-table" style={{ flex: "1 1 520px", boxShadow: "none", margin: 0 }}>
          <thead><tr><th>业务部门</th><th>项目</th><th className="num">实绩</th><th className="num">预算</th><th className="num">差异</th><th className="num">达成率</th></tr></thead>
          <tbody>
            {business.map((b) => {
              if (b.小组.startsWith("JP DESK")) {
                if (b.小组 !== jp[0].小组) return null;
                return (
                  <Fragment key="jpdesk">
                    {renderGroup(jpMerged, jpBudget, { expandable: true, onClick: () => setOpen((o) => !o) })}
                    {open && jp.map((c) => <Fragment key={c.小组}>{renderGroup(c, budgets[c.小组], { child: true })}</Fragment>)}
                  </Fragment>
                );
              }
              return <Fragment key={b.小组}>{renderGroup(b, budgets[b.小组])}</Fragment>;
            })}
          </tbody>
        </table>
        <div style={{ flex: "1 1 320px", minWidth: 300 }}>
          <div style={{ fontWeight: 650, marginBottom: 8, fontSize: 13 }}>业务部门 · 全年累计达成</div>
          {bizFY.map((g) => (
            <div key={g.小组} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginBottom: 3 }}>{g.小组}</div>
              {bullet("毛利", g.act.毛利, g.bud.毛利)}
              {bullet("贩管费", g.act.贩管费, g.bud.贩管费, "neutral")}
              {bullet("净利", g.act.净利, g.bud.净利)}
            </div>
          ))}
        </div>
      </div>

      {/* 管理部门表 + 各部门全年累计达成（右侧空白） */}
      {mgmt.length > 0 && (
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap", marginTop: 16 }}>
          <div style={{ flex: "1 1 420px" }}>
            <h3 style={{ marginTop: 0 }}>管理部门（按中日分 · 含预实）</h3>
            <table className="report-table" style={{ boxShadow: "none", margin: 0 }}>
              <thead><tr><th>部门</th><th className="num">贩管费实绩</th><th className="num">预算</th><th className="num">差异</th><th className="num">达成率</th></tr></thead>
              <tbody>
                {(["中国", "日本"] as const).flatMap((region) => {
                  const list = mgmt.filter((m) => m.地域 === region);
                  if (!list.length) return [];
                  const sub = list.reduce((s, m) => s + m.贩管费, 0);
                  const subBud = list.reduce<number | null>((s, m) => { const b = mgmtBudgets[m.部门]; return b == null ? s : (s || 0) + b; }, null);
                  return [
                    <tr key={region} style={{ background: "var(--panel-2)", borderTop: "2px solid var(--border)" }}>
                      <td style={{ fontWeight: 700 }}>{region}管理 小计</td>
                      <td className="num strong neg">{yen(sub)}</td><td className="num">{subBud == null ? "—" : yen(subBud)}</td>
                      <td className={"num" + (subBud != null && sub - subBud > 0 ? " neg" : "")}>{subBud == null ? "—" : yen(sub - subBud)}</td>
                      <td className="num">{subBud ? ((sub / subBud) * 100).toFixed(0) + "%" : "—"}</td>
                    </tr>,
                    ...list.map((m) => {
                      const b = mgmtBudgets[m.部门] ?? null;
                      return (<tr key={m.部门}><td style={{ paddingLeft: 24, color: "var(--muted)" }}>{m.部门}</td><td className="num neg">{yen(m.贩管费)}</td><td className="num">{b == null ? "—" : yen(b)}</td><td className={"num" + (b != null && m.贩管费 - b > 0 ? " neg" : "")}>{b == null ? "—" : yen(m.贩管费 - b)}</td><td className="num">{b ? ((m.贩管费 / b) * 100).toFixed(0) + "%" : "—"}</td></tr>);
                    }),
                  ];
                })}
              </tbody>
            </table>
          </div>
          <div style={{ flex: "1 1 320px", minWidth: 300 }}>
            <div style={{ fontWeight: 650, marginBottom: 8, fontSize: 13 }}>管理部门贩管费 · 全年累计达成（按部门）</div>
            {(["中国", "日本"] as const).map((region) => {
              const list = mgmtFY.filter((m) => m.地域 === region);
              if (!list.length) return null;
              return (
                <div key={region} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginBottom: 3 }}>{region}管理</div>
                  {list.sort((a, b) => b.实绩 - a.实绩).map((m) => <div key={m.部门}>{bullet(m.部门, m.实绩, m.预算, "neutral")}</div>)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
