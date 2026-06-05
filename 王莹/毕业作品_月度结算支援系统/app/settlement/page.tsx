import { getSettlement, getCashRecon, type CashReconRow } from "@/lib/settlement";
import { getAvailableMonths } from "@/lib/data";
import MonthPicker from "@/app/_components/MonthPicker";
import { BarCard } from "@/app/_components/Charts";

export const dynamic = "force-dynamic";
const fmt = (n: number | null) => (n == null ? "—" : Math.round(n).toLocaleString("ja-JP"));

export default async function SettlementPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const months = await getAvailableMonths();
  const month = (await searchParams).month || months[0] || "2026-05";
  let report = null, cash: CashReconRow[] = [], err: string | null = null;
  try { report = await getSettlement(month); cash = await getCashRecon(month); } catch (e) { err = e instanceof Error ? e.message : String(e); }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>⑥ 月度决算 · 银行残高</h1>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <MonthPicker value={month} basePath="/settlement" />
        <span style={{ color: "var(--muted)", fontSize: 13 }}>残高差额 = 本月末 − 上月末，按币种汇总</span>
      </div>
      {err && <div className="placeholder">读取失败：{err}</div>}
      {report && report.rows.length === 0 && (
        <div className="warn-box">{month} 暂无银行残高数据。请在终端运行 <code>node scripts/sync-bank.mjs {month}</code> 同步。</div>
      )}
      {report && report.rows.length > 0 && (
        <>
          <h3>按币种 · 残高差额</h3>
          <div className="kpi-row">
            {report.byCurrency.map((c) => (
              <div className="kpi" key={c.币种}>
                <div className="kpi-label">{c.币种}（{c.count} 账户）</div>
                <div className="kpi-value" style={{ color: c.差额 >= 0 ? "var(--green)" : "var(--red)" }}>{fmt(c.差额)}</div>
              </div>
            ))}
          </div>

          <div style={{ maxWidth: 600, marginTop: 16 }}>
            <BarCard title="各币种残高差额（绿增红减）" data={report.byCurrency as unknown as Record<string, unknown>[]} xKey="币种" barKey="差额" colorByValue />
          </div>

          <h3>银行 × 币种 明细</h3>
          <table className="report-table">
            <thead><tr><th>银行</th><th>币种</th><th className="num">上月末残高</th><th className="num">本月末残高</th><th className="num">残高差额</th></tr></thead>
            <tbody>
              {report.rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.银行}</td><td>{r.币种}</td>
                  <td className="num">{fmt(r.期初残高)}</td><td className="num">{fmt(r.期末残高)}</td>
                  <td className="num strong" style={{ color: (Number(r.残高差额) || 0) >= 0 ? "var(--green)" : "var(--red)" }}>{fmt(r.残高差额)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {cash.length > 0 && (
            <>
              <h3>现金勾稽 · 残高差额 vs 现金净额（按币种）</h3>
              <table className="report-table">
                <thead><tr><th>币种</th><th className="num">残高差额</th><th className="num">入金</th><th className="num">出金</th><th className="num">现金净额</th><th className="num">差异</th><th>状态</th></tr></thead>
                <tbody>
                  {cash.map((c) => (
                    <tr key={c.币种} className={c.状态 !== "平" ? "flag" : undefined}>
                      <td>{c.币种}</td>
                      <td className="num">{fmt(c.残高差额)}</td><td className="num">{fmt(c.入金合计)}</td><td className="num">{fmt(c.出金合计)}</td>
                      <td className="num">{fmt(c.现金净额)}</td>
                      <td className={"num strong" + (c.差异 !== 0 ? " neg" : "")}>{fmt(c.差异)}</td>
                      <td><span className={`pill ${c.状态 === "平" ? "pill-green" : "pill-amber"}`}>{c.状态}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>口径=实际收付款日（现金制）。差异仅提示、不阻断关账（银行账户未必涵盖全部业务现金，差异需人工排查）。</p>
            </>
          )}
        </>
      )}
    </div>
  );
}
