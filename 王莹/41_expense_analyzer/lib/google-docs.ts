import { google, type docs_v1 } from "googleapis";
import type { Anomaly, Trend, Recommendation } from "@/lib/prompt";
import type { AnalysisStats } from "@/lib/stats";

export type AnalysisReportRow = {
  id: string;
  period_start: string;
  period_end: string;
  summary: string;
  anomalies: Anomaly[];
  trends: Trend[];
  recommendations: Recommendation[];
  stats: AnalysisStats;
  ai_model: string;
  created_at: string;
  google_doc_id?: string | null;
  google_doc_url?: string | null;
};

// 用 refresh_token 构造已授权的 OAuth 客户端
function makeOAuthClient() {
  const cid = process.env.GOOGLE_CLIENT_ID;
  const csec = process.env.GOOGLE_CLIENT_SECRET;
  const rt = process.env.GOOGLE_REFRESH_TOKEN;
  if (!cid || !csec || !rt) throw new Error("缺少 Google OAuth 凭证（CLIENT_ID/CLIENT_SECRET/REFRESH_TOKEN）");
  const oauth = new google.auth.OAuth2(cid, csec);
  oauth.setCredentials({ refresh_token: rt });
  return oauth;
}

// 颜色定义
const COLOR_DANGER  = { red: 0.86, green: 0.22, blue: 0.18 };  // 高/真异常
const COLOR_WARN    = { red: 0.96, green: 0.62, blue: 0.04 };  // 中
const COLOR_OK      = { red: 0.13, green: 0.55, blue: 0.34 };  // 计划内
const COLOR_MUTED   = { red: 0.50, green: 0.50, blue: 0.50 };  // 元数据
const PRIORITY_COLOR: Record<string, { red: number; green: number; blue: number }> = {
  "高": COLOR_DANGER,
  "中": COLOR_WARN,
  "低": COLOR_MUTED,
};

type RGB = { red: number; green: number; blue: number };
type TextOpts = { bold?: boolean; italic?: boolean; color?: RGB; namedStyle?: "TITLE" | "HEADING_1" | "HEADING_2" | "NORMAL_TEXT" };

// 构建 batchUpdate requests。线性追加 text，每次追加同步生成 updateTextStyle / updateParagraphStyle。
function buildRequests(report: AnalysisReportRow): docs_v1.Schema$Request[] {
  const requests: docs_v1.Schema$Request[] = [];
  let cursor = 1;  // 空文档 body 从 index 1 开始（index 0 是 section break）

  const insert = (s: string, opts?: TextOpts) => {
    if (!s) return;
    const start = cursor;
    requests.push({ insertText: { location: { index: start }, text: s } });
    const end = start + s.length;

    const textStyle: docs_v1.Schema$TextStyle = {};
    const fields: string[] = [];
    if (opts?.bold) { textStyle.bold = true; fields.push("bold"); }
    if (opts?.italic) { textStyle.italic = true; fields.push("italic"); }
    if (opts?.color) {
      textStyle.foregroundColor = { color: { rgbColor: opts.color } };
      fields.push("foregroundColor");
    }
    if (fields.length) {
      requests.push({
        updateTextStyle: {
          range: { startIndex: start, endIndex: end },
          textStyle,
          fields: fields.join(","),
        },
      });
    }
    if (opts?.namedStyle) {
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: start, endIndex: end },
          paragraphStyle: { namedStyleType: opts.namedStyle },
          fields: "namedStyleType",
        },
      });
    }
    cursor = end;
  };

  const fmt = (n: number) => Math.round(Number(n)).toLocaleString("ja-JP");
  const wan = (n: number) => (Number(n) / 10000).toFixed(0);
  const pct = (n: number) => (Number(n) * 100).toFixed(1) + "%";

  // —— 标题区 ——
  insert("费用分析报告\n", { namedStyle: "TITLE" });
  insert(`分析期间：${report.period_start} ~ ${report.period_end}\n`);
  insert(`AI 模型：${report.ai_model}    生成时间：${new Date(report.created_at).toLocaleString("zh-CN")}\n\n`, { italic: true, color: COLOR_MUTED });

  // —— 总览 ——
  insert("一、总览\n", { namedStyle: "HEADING_1" });
  insert(`${report.summary}\n\n`);

  // —— 异常分析 ——
  insert(`二、异常分析（共 ${report.anomalies.length} 项）\n`, { namedStyle: "HEADING_1" });
  for (const a of report.anomalies) {
    insert(`【${a.category} ${a.period}】`, { bold: true });
    insert(`  实际 ¥${fmt(a.amount)} / 预算 ¥${fmt(a.budget)}   `);
    insert(a.isPlanned ? "● 计划内\n" : "★ 真异常\n", { bold: true, color: a.isPlanned ? COLOR_OK : COLOR_DANGER });
    insert(`  原因：${a.reason}\n`);
    insert(`  凭据：${a.evidence}\n\n`);
  }

  // —— 趋势分析 ——
  insert("三、趋势分析\n", { namedStyle: "HEADING_1" });
  for (const t of report.trends) {
    insert(`【${t.category}】`, { bold: true });
    insert(` ${t.direction}\n`, { bold: true });
    insert(`  ${t.description}\n\n`);
  }

  // —— 成本削减建议 ——
  insert(`四、成本削减建议（按优先级，共 ${report.recommendations.length} 项）\n`, { namedStyle: "HEADING_1" });
  for (const r of report.recommendations) {
    const color = PRIORITY_COLOR[r.priority] ?? COLOR_MUTED;
    insert(`【${r.priority}优先级】`, { bold: true, color });
    insert(` ${r.title}\n`, { bold: true });
    insert(`  → 动作：${r.action}\n`);
    insert(`  → 预期影响：${r.expectedImpact}\n\n`);
  }

  // —— 数据快照 ——
  insert("五、数据快照（各类目逐月，万円）\n", { namedStyle: "HEADING_1" });
  for (const c of report.stats.categories) {
    insert(`\n● ${c.name}`, { bold: true });
    insert(`  全年 ¥${wan(c.totalActual)}万 / 预算 ¥${wan(c.totalBudget)}万 （消化率 ${pct(c.consumptionRate)}）\n`, { bold: true });
    for (const m of c.monthly) {
      const flag = m.isStatisticalAnomaly ? "  ★统计异常" : m.overBudget > 0 ? "  ⚠超" : "";
      insert(`  ${m.period.slice(0, 7)}  实际 ¥${wan(m.actual).padStart(5)}万 / 预算 ¥${wan(m.budget).padStart(5)}万  (${pct(m.consumptionRate).padStart(6)})${flag}\n`,
        flag.includes("★") ? { color: COLOR_DANGER } : flag.includes("⚠") ? { color: COLOR_WARN } : undefined);
    }
  }

  return requests;
}

export async function renderReportToGoogleDoc(report: AnalysisReportRow): Promise<{ docId: string; docUrl: string }> {
  const auth = makeOAuthClient();
  const docs = google.docs({ version: "v1", auth });

  // 1. 创建空文档（标题作为 Drive 元数据）
  const title = `费用分析报告 ${report.period_start} ~ ${report.period_end}`;
  const created = await docs.documents.create({ requestBody: { title } });
  const documentId = created.data.documentId;
  if (!documentId) throw new Error("Google Docs 未返回 documentId");

  // 2. 一次性 batchUpdate 灌入全部内容 + 样式
  const requests = buildRequests(report);
  await docs.documents.batchUpdate({ documentId, requestBody: { requests } });

  return { docId: documentId, docUrl: `https://docs.google.com/document/d/${documentId}/edit` };
}
