import { getSupabaseAdmin } from "@/lib/supabase-server";
import GeneratePanel from "./_components/GeneratePanel";
import ImportPanel from "./_components/ImportPanel";

export const dynamic = "force-dynamic";

type ReportListItem = {
  id: string;
  period_start: string;
  period_end: string;
  ai_model: string;
  summary: string | null;
  anomalies: Array<{ isPlanned: boolean }> | null;
  recommendations: Array<{ priority: string }> | null;
  google_doc_url: string | null;
  created_at: string;
};

export default async function Home() {
  const sb = getSupabaseAdmin();
  const { data: reports } = await sb
    .from("ex41_analysis_reports")
    .select("id, period_start, period_end, ai_model, summary, anomalies, recommendations, google_doc_url, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const rows = (reports ?? []) as ReportListItem[];

  return (
    <main className="container">
      <header className="hero">
        <h1>📊 费用分析 AI 工具</h1>
        <p className="subtitle">作品 41 · Supabase × Gemini × Google Docs × Slack</p>
      </header>

      <ImportPanel />

      <GeneratePanel />

      <section className="panel history">
        <div className="panel-head">
          <h2>历史报告（最近 10 条）</h2>
        </div>
        {rows.length > 0 ? (
          <table className="reports">
            <thead>
              <tr>
                <th>生成时间</th>
                <th>期间</th>
                <th>AI 模型</th>
                <th>异常 / 真异常</th>
                <th>建议</th>
                <th>报告</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const anomalies = r.anomalies ?? [];
                const real = anomalies.filter((a) => !a.isPlanned).length;
                const recs = r.recommendations ?? [];
                return (
                  <tr key={r.id}>
                    <td>{new Date(r.created_at).toLocaleString("zh-CN")}</td>
                    <td>{r.period_start.slice(0, 7)} ~ {r.period_end.slice(0, 7)}</td>
                    <td><span className="badge">{r.ai_model}</span></td>
                    <td>{anomalies.length} / <span className="danger">{real}</span></td>
                    <td>{recs.length} 条</td>
                    <td>
                      {r.google_doc_url ? (
                        <a href={r.google_doc_url} target="_blank" rel="noopener noreferrer" className="link">📄 Google Doc</a>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="muted">还没有报告，点上面按钮生成第一份。</p>
        )}
      </section>

      <footer className="footer">
        数据源：Supabase ex41_expenses (186 笔 · 12 月) · ex41_budgets (48 行) ｜ 不含税金类目
      </footer>
    </main>
  );
}
