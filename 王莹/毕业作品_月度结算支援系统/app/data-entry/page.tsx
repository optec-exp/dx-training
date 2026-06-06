"use client";

import { useEffect, useState } from "react";

const yen = (n: number | null) => (n == null ? "—" : "¥" + Math.round(n).toLocaleString("ja-JP"));
const inp: React.CSSProperties = { padding: "8px 12px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" };

interface BudgetRow { 期间: string; 报表对象: string; 毛利: number | null; 贩管费: number | null; 净利: number | null }
interface HeadRow { 期间: string; cn: number; jp: number }

export default function DataEntryPage() {
  const [month, setMonth] = useState("2026-05");

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>数据录入</h1>
      <p style={{ color: "var(--muted)" }}>统一的数据准备入口：Kintone 同步 + 预算录入 + 月度人数录入。三者共享下方「目标月份」。</p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "14px 0 22px", padding: "12px 16px", background: "var(--panel-2)", borderRadius: 10, border: "1px solid var(--border)" }}>
        <label style={{ fontWeight: 650 }}>目标月份</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={inp} />
        <span style={{ color: "var(--muted)", fontSize: 13 }}>同步 / 预算 / 人数 均针对此月份</span>
      </div>

      <SyncSection month={month} />
      <BudgetSection month={month} />
      <HeadcountSection month={month} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 18, marginBottom: 18 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--muted)" }}>{label}{children}</label>;
}

// ① Kintone 同步
function SyncSection({ month }: { month: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(type: "cases" | "sga" | "check" | "settlement" | "all") {
    setBusy(type); setError(null); setResult(null);
    try {
      const res = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, month }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(null); }
  }
  const btns: [string, "cases" | "sga" | "check" | "settlement" | "all"][] = [["同步案件", "cases"], ["同步贩管费", "sga"], ["同步排查", "check"], ["同步决算", "settlement"]];

  return (
    <Card title="Kintone 同步">
      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 0 }}>从 Kintone（只读）拉取 {month} 数据，写入 settlement 镜像表。Kintone 数据绝不被修改。</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {btns.map(([label, t]) => <button key={t} className="btn" disabled={!!busy} onClick={() => run(t)}>{busy === t ? "同步中…" : label}</button>)}
        <button className="btn primary" disabled={!!busy} onClick={() => run("all")}>{busy === "all" ? "同步中…" : "全部同步"}</button>
      </div>
      {error && <div className="warn-box" style={{ borderColor: "var(--red)", color: "var(--red)", marginTop: 12 }}>同步失败：{error}</div>}
      {result != null && (
        <div className="card" style={{ marginTop: 12, padding: 12 }}>
          <div style={{ color: "var(--green)", marginBottom: 8 }}>✅ 同步完成</div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 13 }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </Card>
  );
}

// ② 预算录入
function BudgetSection({ month }: { month: string }) {
  const [对象, set对象] = useState("全社");
  const [毛利, set毛利] = useState("");
  const [贩管费, set贩管费] = useState("");
  const [净利, set净利] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [list, setList] = useState<BudgetRow[]>([]);
  const [objects, setObjects] = useState<string[]>(["全社", "中国", "日本"]);

  async function load() { const r = await fetch("/api/budget").then((x) => x.json()).catch(() => ({ rows: [] })); setList(r.rows || []); if (r.objects?.length) setObjects(r.objects); }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!对象) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/budget", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ 期间: month, 报表对象: 对象, 毛利: Number(毛利), 贩管费: Number(贩管费), 净利: Number(净利) }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setMsg("✅ 已保存，利润报表 / 综合汇报将显示该对象预实"); set毛利(""); set贩管费(""); set净利(""); load();
    } catch (e) { setMsg("❌ " + (e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  }

  return (
    <Card title="预算录入">
      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 0 }}>录入 {month} 各报表对象的 毛利/贩管费/净利 预算。报表对象支持 <b>全社 / 中国 / 日本 / 各业务部门 / 各管理部门</b>，填齐后达成率全维度铺满。</p>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <Field label="报表对象">
          <input list="budget-objects" value={对象} onChange={(e) => set对象(e.target.value)} style={{ ...inp, width: 180 }} placeholder="选择或输入" />
          <datalist id="budget-objects">{objects.map((o) => <option key={o} value={o} />)}</datalist>
        </Field>
        <Field label="毛利预算"><input type="number" value={毛利} onChange={(e) => set毛利(e.target.value)} style={{ ...inp, width: 140 }} /></Field>
        <Field label="贩管费预算"><input type="number" value={贩管费} onChange={(e) => set贩管费(e.target.value)} style={{ ...inp, width: 140 }} /></Field>
        <Field label="净利预算"><input type="number" value={净利} onChange={(e) => set净利(e.target.value)} style={{ ...inp, width: 140 }} /></Field>
        <button className="btn primary" disabled={busy} onClick={save}>{busy ? "保存中…" : "保存"}</button>
      </div>
      {msg && <div className="warn-box" style={{ borderColor: "var(--border)", background: "var(--panel-2)", color: "var(--text)", marginTop: 12 }}>{msg}</div>}
      <details style={{ marginTop: 14 }}>
        <summary style={{ cursor: "pointer", fontWeight: 650, fontSize: 13, color: "var(--muted)" }}>已录入预算（{list.length}）</summary>
        <table className="report-table">
          <thead><tr><th>月份</th><th>对象</th><th className="num">毛利</th><th className="num">贩管费</th><th className="num">净利</th></tr></thead>
          <tbody>
            {list.map((r, i) => (<tr key={i}><td>{r.期间}</td><td>{r.报表对象}</td><td className="num">{yen(r.毛利)}</td><td className="num">{yen(r.贩管费)}</td><td className="num">{yen(r.净利)}</td></tr>))}
            {list.length === 0 && <tr><td colSpan={5} style={{ color: "var(--muted)" }}>暂无</td></tr>}
          </tbody>
        </table>
      </details>
    </Card>
  );
}

// ③ 月度人数录入
function HeadcountSection({ month }: { month: string }) {
  const [cn, setCn] = useState("13");
  const [jp, setJp] = useState("11");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [list, setList] = useState<HeadRow[]>([]);

  async function load() { const r = await fetch("/api/headcount/list").then((x) => x.json()).catch(() => ({ rows: [] })); setList(r.rows || []); }
  useEffect(() => { load(); }, []);

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/headcount", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ 期间: month, cn: Number(cn), jp: Number(jp) }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setMsg("✅ 已保存，利润报表 JP DESK 拆分将使用该人数"); load();
    } catch (e) { setMsg("❌ " + (e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  }

  return (
    <Card title="月度人数录入 · JP DESK 中日拆分">
      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 0 }}>JP DESK（Japan Desk 課）利润按 {month} 中日人数拆分。未录入则默认 13 : 11。</p>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <Field label="JP DESK 中国人数"><input type="number" value={cn} onChange={(e) => setCn(e.target.value)} style={{ ...inp, width: 120 }} /></Field>
        <Field label="JP DESK 日本人数(TCC+業務)"><input type="number" value={jp} onChange={(e) => setJp(e.target.value)} style={{ ...inp, width: 120 }} /></Field>
        <button className="btn primary" disabled={busy} onClick={save}>{busy ? "保存中…" : "保存"}</button>
      </div>
      {msg && <div className="warn-box" style={{ borderColor: "var(--border)", background: "var(--panel-2)", color: "var(--text)", marginTop: 12 }}>{msg}</div>}
      <details style={{ marginTop: 14 }}>
        <summary style={{ cursor: "pointer", fontWeight: 650, fontSize: 13, color: "var(--muted)" }}>已录入（{list.length}）</summary>
        <table className="report-table" style={{ maxWidth: 480 }}>
          <thead><tr><th>月份</th><th className="num">中国人数</th><th className="num">日本人数</th></tr></thead>
          <tbody>
            {list.map((r) => (<tr key={r.期间}><td>{r.期间}</td><td className="num">{r.cn}</td><td className="num">{r.jp}</td></tr>))}
            {list.length === 0 && <tr><td colSpan={3} style={{ color: "var(--muted)" }}>暂无（使用默认 13:11）</td></tr>}
          </tbody>
        </table>
      </details>
    </Card>
  );
}
