"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Phase = "idle" | "running" | "done" | "error";
type SubStep = "analyzing" | "rendering" | "notifying";

type AnalyzeResp = {
  reportId: string;
  model: string;
  analysis: {
    summary: string;
    anomalies: Array<{ category: string; period: string; isPlanned: boolean; amount: number; budget: number }>;
    trends: Array<{ category: string; direction: string }>;
    recommendations: Array<{ priority: string; title: string; expectedImpact: string }>;
  };
};

const STEPS: { key: SubStep; label: string }[] = [
  { key: "analyzing", label: "Gemini 财务分析" },
  { key: "rendering", label: "生成 Google Doc 报告" },
  { key: "notifying", label: "推送 Slack 通知" },
];

function stepIcon(phase: Phase, currentStep: SubStep | null, mine: SubStep): string {
  if (phase === "done") return "✓";
  if (phase === "idle") return "○";
  const order: SubStep[] = ["analyzing", "rendering", "notifying"];
  const cur = currentStep ? order.indexOf(currentStep) : -1;
  const me = order.indexOf(mine);
  if (cur > me) return "✓";
  if (cur === me) return phase === "error" ? "✗" : "⏳";
  return "○";
}

// "YYYY-MM" → 该月最后一天 "YYYY-MM-DD"
function endOfMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${ym}-${String(lastDay).padStart(2, "0")}`;
}

export default function GeneratePanel() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentStep, setCurrentStep] = useState<SubStep | null>(null);
  const [result, setResult] = useState<AnalyzeResp | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fromMonth, setFromMonth] = useState("2025-06");
  const [toMonth, setToMonth] = useState("2026-05");
  const router = useRouter();

  const rangeValid = fromMonth && toMonth && fromMonth <= toMonth;

  async function run() {
    setError(null);
    setResult(null);
    setDocUrl(null);
    setPhase("running");

    const fromDate = `${fromMonth}-01`;
    const toDate = endOfMonth(toMonth);

    try {
      setCurrentStep("analyzing");
      const r1 = await fetch(`/api/analyze?from=${fromDate}&to=${toDate}`, { method: "POST" });
      if (!r1.ok) throw new Error("分析失败: " + (await r1.text()).slice(0, 200));
      const j: AnalyzeResp = await r1.json();
      setResult(j);

      setCurrentStep("rendering");
      const r2 = await fetch(`/api/reports/${j.reportId}/render`, { method: "POST" });
      if (!r2.ok) throw new Error("Doc 渲染失败: " + (await r2.text()).slice(0, 200));
      const j2 = await r2.json();
      setDocUrl(j2.docUrl);

      setCurrentStep("notifying");
      const r3 = await fetch(`/api/reports/${j.reportId}/notify`, { method: "POST" });
      if (!r3.ok) throw new Error("Slack 通知失败: " + (await r3.text()).slice(0, 200));

      setPhase("done");
      router.refresh();
    } catch (e) {
      setPhase("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const running = phase === "running";
  const realAnomalies = result?.analysis.anomalies.filter((a) => !a.isPlanned).length ?? 0;
  const priorityCount = (p: string) => result?.analysis.recommendations.filter((r) => r.priority === p).length ?? 0;

  return (
    <section className="panel generate">
      <div className="panel-head">
        <h2>生成新分析报告</h2>
        <span className="muted">空数据期间会得到"无可分析数据"的报告，请确保期间内已有 ex41_expenses 记录</span>
      </div>

      <div className="range-picker">
        <label>
          起始月
          <input type="month" value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} disabled={running} />
        </label>
        <span className="range-sep">~</span>
        <label>
          结束月
          <input type="month" value={toMonth} onChange={(e) => setToMonth(e.target.value)} disabled={running} />
        </label>
      </div>

      {!rangeValid && (
        <p className="muted danger-text">⚠ 起始月必须 ≤ 结束月</p>
      )}

      <button onClick={run} disabled={running || !rangeValid} className="btn-primary">
        {running ? "处理中…" : "🚀 开始分析"}
      </button>

      {phase !== "idle" && (
        <ol className="progress">
          {STEPS.map((s, i) => (
            <li key={s.key} className={currentStep === s.key ? "active" : ""}>
              <span className="icon">{stepIcon(phase, currentStep, s.key)}</span>
              <span className="label">{i + 1}. {s.label}</span>
            </li>
          ))}
        </ol>
      )}

      {error && (
        <div className="alert error">
          <strong>❌ 失败</strong>
          <pre>{error}</pre>
        </div>
      )}

      {result && phase === "done" && (
        <div className="result">
          <div className="result-head">
            <h3>本次结果</h3>
            <span className="badge">{result.model}</span>
          </div>
          <p className="summary">{result.analysis.summary}</p>
          <div className="metrics">
            <div className="metric">
              <div className="metric-value">{result.analysis.anomalies.length}</div>
              <div className="metric-label">统计异常</div>
            </div>
            <div className="metric">
              <div className="metric-value danger">{realAnomalies}</div>
              <div className="metric-label">真异常</div>
            </div>
            <div className="metric">
              <div className="metric-value">{result.analysis.trends.length}</div>
              <div className="metric-label">趋势</div>
            </div>
            <div className="metric">
              <div className="metric-value">{result.analysis.recommendations.length}</div>
              <div className="metric-label">建议（高{priorityCount("高")}/中{priorityCount("中")}/低{priorityCount("低")}）</div>
            </div>
          </div>
          {docUrl && (
            <a href={docUrl} target="_blank" rel="noopener noreferrer" className="btn-doc">
              📄 打开 Google Doc 完整报告 ↗
            </a>
          )}
        </div>
      )}
    </section>
  );
}
