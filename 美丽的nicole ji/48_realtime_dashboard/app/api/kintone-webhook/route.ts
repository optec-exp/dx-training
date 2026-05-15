import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ ok: false, error: "SLACK_WEBHOOK_URL not set" });
  }

  // Kintone webhook payload
  const body = await req.json();

  // 只处理新增记录事件
  if (body.type !== "APP_RECORD_ADD") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const record  = body.record || {};
  const title   = record["主题"]?.value    || "（无标题）";
  const content = record["詳細内容"]?.value || "（无内容）";
  const type    = record["类型"]?.value    || "—";
  const recNo   = record["レコード番号"]?.value || "";

  const message = {
    text: [
      "*📚 知识库新增记录*",
      `レコード番号: ${recNo}`,
      `主题: ${title}`,
      `类型: ${type}`,
      `详细内容:\n${content}`,
    ].join("\n"),
  };

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
