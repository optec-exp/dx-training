// 从 DB 读取最新分析报告并写到可读文本文件（绕开 PowerShell UTF-8 显示问题）
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await sb
  .from("ex41_analysis_reports")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(1);
if (error) { console.error(error); process.exit(1); }
const r = data[0];

const out = [
  `report id : ${r.id}`,
  `model     : ${r.ai_model}`,
  `period    : ${r.period_start} ~ ${r.period_end}`,
  `created   : ${r.created_at}`,
  ``,
  `=== SUMMARY ===`,
  r.summary,
  ``,
  `=== ANOMALIES (${r.anomalies.length}) ===`,
  ...r.anomalies.map(a => `[${a.category} ${a.period}] ¥${a.amount.toLocaleString("ja-JP")} / 预算¥${a.budget.toLocaleString("ja-JP")} / isPlanned=${a.isPlanned}\n  reason  : ${a.reason}\n  evidence: ${a.evidence}`),
  ``,
  `=== TRENDS (${r.trends.length}) ===`,
  ...r.trends.map(t => `[${t.category}] ${t.direction}\n  ${t.description}`),
  ``,
  `=== RECOMMENDATIONS (${r.recommendations.length}) ===`,
  ...r.recommendations.map(rec => `【${rec.priority}】${rec.title}\n  动作: ${rec.action}\n  影响: ${rec.expectedImpact}`),
].join("\n\n");

fs.writeFileSync(".check-report.txt", out, "utf8");
console.log("OK wrote .check-report.txt (" + out.length + " chars)");
