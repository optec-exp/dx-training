import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { getDashboard } from "@/lib/dashboard";
import DashboardCharts from "@/app/_components/DashboardCharts";

export const dynamic = "force-dynamic";
const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

export default async function Home() {
  let data = null, err: string | null = null;
  try { data = await getDashboard(); } catch (e) { err = e instanceof Error ? e.message : String(e); }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 style={{ marginTop: 0 }}>经营驾驶舱</h1>
        {data && <span style={{ color: "var(--muted)", fontSize: 13 }}>当前月份 {data.current}</span>}
      </div>

      {err && <div className="placeholder">读取失败：{err}</div>}

      {data && (
        <>
          <div className="kpi-row">
            <div className="kpi primary"><div className="kpi-label">全社净利（{data.current}）</div><div className="kpi-value">{yen(data.全社净利)}</div></div>
            <div className="kpi tinted"><div className="kpi-label">中国净利</div><div className="kpi-value" style={{ color: "var(--accent)" }}>{yen(data.中国净利)}</div></div>
            <div className="kpi tinted"><div className="kpi-label">日本净利</div><div className="kpi-value" style={{ color: "var(--accent)" }}>{yen(data.日本净利)}</div></div>
            <div className="kpi"><div className="kpi-label">应收超期</div><div className="kpi-value" style={{ color: "var(--red)" }}>{yen(data.应收超期)}</div></div>
          </div>

          <DashboardCharts data={data} />
        </>
      )}

      <h3>功能模块</h3>
      <div className="cards">
        {MODULES.map((m) => (
          <Link key={m.slug} href={`/${m.slug}`} className="card">
            <div className="no">{m.no}</div>
            <div className="title">{m.title}</div>
            <div className="desc">{m.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
