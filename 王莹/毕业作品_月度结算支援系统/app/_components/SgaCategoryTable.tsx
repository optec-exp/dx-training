import type { SgaCatRow } from "@/lib/profit";
import { FEE4 } from "@/lib/sga";

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

export default function SgaCategoryTable({ title, rows, nameLabel }: { title: string; rows: SgaCatRow[]; nameLabel: string }) {
  const cats = FEE4 as readonly string[];
  const shown = rows.filter((r) => r.total !== 0);
  if (shown.length === 0) return null;
  const colTotal = (c: string) => shown.reduce((s, r) => s + (r.byCat[c] || 0), 0);
  const grand = shown.reduce((s, r) => s + r.total, 0);
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 650, marginBottom: 6 }}>{title} <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 400 }}>· 不含役員関連費用（役員只在全社/中日）</span></div>
      <table className="report-table" style={{ maxWidth: 880 }}>
        <thead>
          <tr><th>{nameLabel}</th>{cats.map((c) => <th key={c} className="num">{c}</th>)}<th className="num">合计</th></tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={r.name}>
              <td>{r.name}{r.地域 ? <span style={{ color: "var(--muted)", fontSize: 11 }}>　{r.地域}</span> : null}</td>
              {cats.map((c) => <td key={c} className="num">{r.byCat[c] ? yen(r.byCat[c]) : "—"}</td>)}
              <td className="num strong">{yen(r.total)}</td>
            </tr>
          ))}
          <tr style={{ background: "var(--panel-2)", borderTop: "2px solid var(--border)" }}>
            <td style={{ fontWeight: 700 }}>合计</td>
            {cats.map((c) => <td key={c} className="num strong">{yen(colTotal(c))}</td>)}
            <td className="num strong">{yen(grand)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
