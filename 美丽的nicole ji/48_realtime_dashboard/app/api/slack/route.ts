import { NextResponse } from "next/server";

type KintoneRecord = {
  kintone_id?: string;
  case_number?: string;
  customer_name?: string;
  status?: string;
  mode?: string;
  eta?: string;
  awb_no?: string;
};

// 查询知识库，按关联案件号搜索
async function queryKnowledgeBase(caseNumber: string): Promise<string> {
  const subdomain = process.env.KNOWLEDGE_BASE_SUBDOMAIN;
  const appId     = process.env.KNOWLEDGE_BASE_APP_ID;
  const token     = process.env.KNOWLEDGE_BASE_API_TOKEN;

  if (!subdomain || !appId || !token || !caseNumber) return "";

  const query = encodeURIComponent(`関連案件号 = "${caseNumber}" limit 3`);
  const url   = `https://${subdomain}.cybozu.com/k/v1/records.json?app=${appId}&query=${query}&fields[0]=主题&fields[1]=詳細内容`;

  try {
    const res = await fetch(url, {
      headers: { "X-Cybozu-API-Token": token },
    });
    const data = await res.json();
    if (!data.records || data.records.length === 0) return "";

    return data.records
      .map((r: Record<string, { value: string }>, i: number) =>
        `*${i + 1}. ${r["主题"]?.value || "（无标题）"}*\n${r["詳細内容"]?.value || ""}`.trim()
      )
      .join("\n\n");
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  const { record } = await req.json() as { record: KintoneRecord };
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json({ ok: false, error: "SLACK_WEBHOOK_URL not set" });
  }

  // 查询知识库
  const knowledgeContent = record.case_number
    ? await queryKnowledgeBase(record.case_number)
    : "";

  const lines = [
    "*📦 新记录插入 kintone_records*",
    `案件番号: ${record.case_number    || "—"}`,
    `客户名:   ${record.customer_name  || "—"}`,
    `状态:     ${record.status         || "—"}`,
    `Mode:     ${record.mode           || "—"}`,
    `ETA:      ${record.eta            || "—"}`,
    `AWB:      ${record.awb_no         || "—"}`,
  ];

  if (knowledgeContent) {
    lines.push("", "📚 *知识库相关内容*", knowledgeContent);
  }

  const message = { text: lines.join("\n") };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
