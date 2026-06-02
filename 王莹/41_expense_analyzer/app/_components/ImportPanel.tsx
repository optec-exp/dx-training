"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type ImportType = "expenses" | "budgets";

type ImportResult = {
  dryRun?: boolean;
  total?: number;
  valid?: number;
  inserted?: number;
  replaced?: boolean;
  errors?: Array<{ line: number; message: string }>;
  preview?: unknown[];
  error?: string;
};

export default function ImportPanel() {
  const [type, setType] = useState<ImportType>("expenses");
  const [file, setFile] = useState<File | null>(null);
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function send(dryRun: boolean) {
    if (!file) { setError("请先选择 CSV 文件"); return; }
    setBusy(true); setError(null); setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const qs = new URLSearchParams();
      if (dryRun) qs.set("dry_run", "1");
      if (replace) qs.set("replace", "1");
      const r = await fetch(`/api/import/${type}?${qs.toString()}`, { method: "POST", body: form });
      const j: ImportResult = await r.json();
      setResult(j);
      if (!r.ok) {
        setError(j.error ?? "导入失败");
      } else if (!dryRun) {
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel import">
      <div className="panel-head">
        <h2>📥 导入真实数据（CSV）</h2>
        <span className="muted">把你公司的真实费用/预算数据上传到数据库</span>
      </div>

      <div className="import-form">
        <label className="field">
          <span>① 导入类型</span>
          <select value={type} onChange={(e) => setType(e.target.value as ImportType)} disabled={busy}>
            <option value="expenses">费用明细（ex41_expenses）</option>
            <option value="budgets">月度预算（ex41_budgets）</option>
          </select>
        </label>

        <label className="field">
          <span>② 选择 CSV 文件</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); setError(null); }}
            disabled={busy}
          />
        </label>

        <label className="check">
          <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} disabled={busy} />
          <span>替换现有数据（先清空整张表再导入；预算导入会用 upsert，无需此项）</span>
        </label>

        <p className="muted small">
          📑 下载模板：
          <a className="link" href={`/templates/${type}.csv`} download>{type}.csv</a>
          ｜ 列名必须是英文（date / category / department / amount / vendor / description；预算用 period / category / budget_amount）
        </p>
      </div>

      <div className="import-actions">
        <button className="btn-secondary" onClick={() => send(true)} disabled={busy || !file}>
          {busy ? "处理中…" : "👁 仅校验（不写入）"}
        </button>
        <button className="btn-primary" onClick={() => send(false)} disabled={busy || !file}>
          {busy ? "处理中…" : "💾 导入到数据库"}
        </button>
      </div>

      {error && (
        <div className="alert error">
          <strong>❌ {error}</strong>
        </div>
      )}

      {result && (
        <div className="import-result">
          <div className="metrics">
            <div className="metric">
              <div className="metric-value">{result.total ?? 0}</div>
              <div className="metric-label">CSV 数据行数</div>
            </div>
            <div className="metric">
              <div className="metric-value">{result.valid ?? result.inserted ?? 0}</div>
              <div className="metric-label">{result.dryRun ? "有效行" : result.inserted ? "已写入" : "有效行"}</div>
            </div>
            <div className="metric">
              <div className="metric-value danger">{result.errors?.length ?? 0}</div>
              <div className="metric-label">错误行</div>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="error-list">
              <h4>错误清单（前 20 条）</h4>
              <ul>
                {result.errors.slice(0, 20).map((e, i) => (
                  <li key={i}><span className="danger">第 {e.line} 行：</span> {e.message}</li>
                ))}
              </ul>
            </div>
          )}

          {result.dryRun && result.preview && result.preview.length > 0 && (
            <details className="preview">
              <summary>展开样例（前 3 条预览）</summary>
              <pre>{JSON.stringify(result.preview, null, 2)}</pre>
            </details>
          )}

          {!result.dryRun && (result.inserted ?? 0) > 0 && (
            <div className="alert success">
              ✓ 成功写入 {result.inserted} 条{result.replaced ? "（已先清空原数据）" : ""} —— 现在可以到上面"生成新分析报告"用新数据分析了
            </div>
          )}
        </div>
      )}
    </section>
  );
}
