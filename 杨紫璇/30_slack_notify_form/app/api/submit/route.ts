import { NextRequest, NextResponse } from "next/server";

const SUBDOMAIN     = process.env.KINTONE_SUBDOMAIN!;
const APP_ID        = process.env.KINTONE_APP_ID!;
const API_TOKEN     = process.env.KINTONE_API_TOKEN!;
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL!;

async function postToKintone(姓名: string, 电话: string, 生日: string) {
  const res = await fetch(`https://${SUBDOMAIN}.cybozu.com/k/v1/record.json`, {
    method: "POST",
    headers: {
      "X-Cybozu-API-Token": API_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app: APP_ID,
      record: {
        姓名: { value: 姓名 },
        电话: { value: 电话 },
        生日: { value: 生日 },
      },
    }),
  });
  const text = await res.text();
  let data: Record<string, string> = {};
  try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data.message ?? text);
  return data.id as string;
}

async function postToSlack(姓名: string, 电话: string, 生日: string, recordId: string) {
  const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  await fetch(SLACK_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "📋 新規登録通知 | OPTEC", emoji: true },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*姓名:*\n${姓名}` },
            { type: "mrkdwn", text: `*电话:*\n${电话 || "—"}` },
            { type: "mrkdwn", text: `*生日:*\n${生日 || "—"}` },
            { type: "mrkdwn", text: `*Kintone レコード ID:*\n${recordId}` },
          ],
        },
        { type: "divider" },
        {
          type: "context",
          elements: [
            { type: "mrkdwn", text: `✅ Kintone App ${APP_ID} に登録完了 | ${now}` },
          ],
        },
      ],
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { 姓名, 电话, 生日 } = await req.json();

    // 1. Write to Kintone
    const recordId = await postToKintone(姓名 ?? "", 电话 ?? "", 生日 ?? "");

    // 2. Notify Slack
    await postToSlack(姓名 ?? "", 电话 ?? "", 生日 ?? "", recordId);

    return NextResponse.json({ ok: true, id: recordId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
