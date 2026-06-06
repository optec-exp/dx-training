import { getReceivablesAging, getPayablesAging, getCashflowForecast, type AgingReport, type CFRow } from "@/lib/treasury";
import { getBankBalanceTrend } from "@/lib/settlement";
import { BarCard, LineCard } from "@/app/_components/Charts";
import InvestmentPanel from "@/app/_components/InvestmentPanel";
import AgingSyncButton from "@/app/_components/AgingSyncButton";

export const dynamic = "force-dynamic";
const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

export default async function TreasuryPage() {
  let ar: AgingReport | null = null, ap: AgingReport | null = null, err: string | null = null;
  let bankTrend: { 月份: string; 円換算残高: number }[] = [];
  let forecast: CFRow[] = [];
  try { ar = await getReceivablesAging(); ap = await getPayablesAging(); bankTrend = await getBankBalanceTrend(); }
  catch (e) { err = e instanceof Error ? e.message : String(e); }
  try { forecast = await getCashflowForecast(); } catch { forecast = []; } // 预计收付日列未建时不报错

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>⑦ 资金管理</h1>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <AgingSyncButton />
        <span style={{ color: "var(--muted)", fontSize: 12 }}>未收/未付按到期日(支払期日)分账龄 + 滚动现金流预测；基准日=今天</span>
      </div>
      {err && <div className="placeholder">读取失败：{err}</div>}
      {ar && ap && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>资金净头寸（应收 − 应付）</h3>
          <div className="kpi-row">
            <div className="kpi primary"><div className="kpi-label">净头寸</div><div className="kpi-value">{yen(ar.total - ap.total)}</div></div>
            <div className="kpi tinted"><div className="kpi-label">应收合计</div><div className="kpi-value" style={{ fontSize: 20, color: "var(--accent)" }}>{yen(ar.total)}</div></div>
            <div className="kpi"><div className="kpi-label">应付合计</div><div className="kpi-value" style={{ fontSize: 20, color: "var(--amber)" }}>{yen(ap.total)}</div></div>
            <div className="kpi"><div className="kpi-label">超期净敞口</div><div className="kpi-value" style={{ fontSize: 20, color: "var(--red)" }}>{yen(ar.overdueAmt - ap.overdueAmt)}</div></div>
          </div>
        </div>
      )}

      {/* 现金流滚动预测 */}
      {forecast.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginTop: 0 }}>现金流滚动预测（按预计收付日）</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, alignItems: "start" }}>
            <table className="report-table" style={{ margin: 0 }}>
              <thead><tr><th>期间</th><th className="num">应收</th><th className="num">应付</th><th className="num">净流入</th><th className="num">累计净额</th></tr></thead>
              <tbody>
                {forecast.map((r) => (
                  <tr key={r.期间} className={r.期间 === "已逾期" ? "flag" : undefined}>
                    <td>{r.期间}</td><td className="num">{yen(r.应收)}</td><td className="num">{yen(r.应付)}</td>
                    <td className={"num strong" + (r.净流入 < 0 ? " neg" : "")}>{yen(r.净流入)}</td>
                    <td className={"num" + (r.累计净额 < 0 ? " neg" : "")}>{yen(r.累计净额)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <LineCard title="累计净现金流" data={forecast as unknown as Record<string, unknown>[]} xKey="期间" lines={[{ key: "累计净额", name: "累计净额", color: "#2563eb" }, { key: "净流入", name: "当期净流入", color: "#34d399" }]} />
          </div>
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>「已逾期」=到期日已过仍未收/付；按月滚动看未来现金净流入/流出与累计头寸。</p>
        </div>
      )}

      {/* 应收 / 应付 双栏 */}
      {ar && <AgingBlock title="应收账龄" report={ar} labelName="客户" accent="var(--accent)" />}
      {ap && <AgingBlock title="应付账龄" report={ap} labelName="供应商" accent="var(--amber)" />}

      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>円換算残高 趋势（所有账户合计 · 折日元）</h3>
        {bankTrend.length === 0 ? (
          <div className="warn-box">暂无银行残高数据。到 <a href="/settlement" style={{ color: "var(--accent)" }}>⑥ 月度决算</a> 点「↻ 重新同步」逐月拉取。</div>
        ) : bankTrend.length === 1 ? (
          <div className="kpi-row">
            <div className="kpi primary"><div className="kpi-label">{bankTrend[0].月份} 円換算残高合计</div><div className="kpi-value">{yen(bankTrend[0].円換算残高)}</div></div>
            <div className="kpi"><div className="kpi-label">提示</div><div style={{ color: "var(--muted)", fontSize: 13, padding: "8px 0" }}>同步多个月份后显示趋势折线</div></div>
          </div>
        ) : (
          <div style={{ maxWidth: 720 }}>
            <LineCard title="" data={bankTrend as unknown as Record<string, unknown>[]} xKey="月份" lines={[{ key: "円換算残高", name: "円換算残高合计", color: "#2563eb" }]} />
          </div>
        )}
      </div>

      <InvestmentPanel />
    </div>
  );
}

function AgingBlock({ title, report, labelName, accent }: { title: string; report: AgingReport; labelName: string; accent: string }) {
  if (report.count === 0) return <div className="warn-box" style={{ marginTop: 20 }}>{title}：暂无数据（运行 sync-ar.mjs / sync-ap.mjs）。</div>;
  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div className="kpi-row">
        <div className="kpi"><div className="kpi-label">{title}总额</div><div className="kpi-value" style={{ fontSize: 20 }}>{yen(report.total)}</div></div>
        <div className="kpi"><div className="kpi-label">超期金额</div><div className="kpi-value" style={{ fontSize: 20, color: "var(--red)" }}>{yen(report.overdueAmt)}</div></div>
        <div className="kpi"><div className="kpi-label">超期笔数</div><div className="kpi-value" style={{ color: "var(--red)" }}>{report.overdueCount}</div></div>
        <div className="kpi"><div className="kpi-label">总笔数</div><div className="kpi-value">{report.count}</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 14, alignItems: "start" }}>
        <BarCard title="账龄分布（金额）" data={report.buckets as unknown as Record<string, unknown>[]} xKey="bucket" barKey="amt" />
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 650, marginBottom: 8 }}>Top 10 {labelName}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
            <tbody>
              {report.topCustomers.map((c) => (
                <tr key={c.name}><td style={{ padding: "3px 0" }}>{c.name}</td><td style={{ padding: "3px 0", textAlign: "right", fontWeight: 600, color: accent }}>{yen(c.amt)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
