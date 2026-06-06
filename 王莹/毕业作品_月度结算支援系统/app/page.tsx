import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { getDashboard } from "@/lib/dashboard";
import DashboardCharts from "@/app/_components/DashboardCharts";
import PeriodSelect from "@/app/_components/PeriodSelect";

export const dynamic = "force-dynamic";
const wan = (n: number) => "¥" + (n / 10000).toLocaleString("ja-JP", { maximumFractionDigits: 0 }) + "万";
const pct = (n: number) => (n * 100).toFixed(1) + "%";

export default async function Home({ searchParams }: { searchParams: Promise<{ months?: string }> }) {
  const sp = await searchParams;
  const selected = sp.months ? sp.months.split(",").filter(Boolean) : undefined;
  let data = null, err: string | null = null;
  try { data = await getDashboard(selected); } catch (e) { err = e instanceof Error ? e.message : String(e); }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ marginTop: 0 }}>经营驾驶舱</h1>
        {data && <span style={{ color: "var(--muted)", fontSize: 13 }}>期间：{data.periodLabel}</span>}
      </div>
      {data && <div style={{ marginBottom: 16 }}><PeriodSelect available={data.available} selected={data.selected} basePath="/" /></div>}

      {err && <div className="placeholder">读取失败：{err}</div>}

      {data && (
        <>
          <div className="kpi-row">
            <div className="kpi primary">
              <div className="kpi-label">💰 净利（{data.periodLabel}）</div>
              <div className="kpi-value">{wan(data.净利)}</div>
              {data.环比净利 != null && (
                <div style={{ fontSize: 12, marginTop: 4, color: data.环比净利 >= 0 ? "#bbf7d0" : "#fecaca" }}>
                  {data.环比净利 >= 0 ? "↑" : "↓"} 环比 {pct(Math.abs(data.环比净利))}（最新月 vs 上月）
                </div>
              )}
            </div>
            <div className="kpi tinted"><div className="kpi-label">📈 毛利</div><div className="kpi-value" style={{ color: "var(--accent)" }}>{wan(data.毛利)}</div></div>
            <div className="kpi tinted"><div className="kpi-label">🧾 贩管费</div><div className="kpi-value" style={{ color: "var(--accent)" }}>{wan(data.贩管费)}</div></div>
            <div className="kpi"><div className="kpi-label">📊 净利率</div><div className="kpi-value">{pct(data.净利率)}</div></div>
          </div>

          <div className="kpi-row" style={{ marginTop: 6 }}>
            <Warn icon="🔴" label="负毛利票（最新月）" value={String(data.负毛利数)} bad={data.负毛利数 > 0} />
            <Warn icon="⏳" label="应收超期" value={wan(data.应收超期)} bad={data.应收超期 > 0} />
            <Warn icon="🧮" label="对账待处理" value={String(data.对账待处理)} bad={data.对账待处理 > 0} />
            <Warn icon="🇨🇳/🇯🇵" label="中国/日本净利" value={`${wan(data.中国净利)} / ${wan(data.日本净利)}`} />
          </div>

          <DashboardCharts data={data} />
        </>
      )}

      <h3>功能模块</h3>
      <div className="cards">
        {MODULES.map((m) => (
          <Link key={m.slug} href={`/${m.slug}`} className="card">
            <div className="title">{m.title}</div>
            <div className="desc">{m.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Warn({ icon, label, value, bad }: { icon: string; label: string; value: string; bad?: boolean }) {
  return (
    <div className="kpi" style={bad ? { borderColor: "#fbcfe0" } : undefined}>
      <div className="kpi-label">{icon} {label}</div>
      <div className="kpi-value" style={{ fontSize: 18, color: bad ? "var(--red)" : "var(--text)" }}>{value}</div>
    </div>
  );
}
