import { NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID = process.env.KINTONE_APP_ID!;
const API_TOKEN = process.env.KINTONE_API_TOKEN!;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL!;

// Step 1: Kintone に書き込む
async function saveToKintone(name: string, email: string, content: string) {
  const res = await fetch(
    `https://${SUBDOMAIN}.cybozu.com/k/v1/record.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Cybozu-API-Token": API_TOKEN,
      },
      body: JSON.stringify({
        app: APP_ID,
        record: {
          Name: { value: name },
          Email: { value: email },
          content: { value: content },
        },
      }),
    }
  );
  if (!res.ok) throw new Error("Kintone 写入失败");
  const data = await res.json();
  return data.id;
}

// Step 2: Slack に通知する
async function notifySlack(name: string, email: string, content: string, recordId: string) {
  const res = await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `📋 收到新问询！\n姓名: ${name}\n邮箱: ${email}\n内容: ${content}\nKintone ID: ${recordId}`,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Slack 通知失败: ${errText}`);
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, content } = await req.json();

    // Step 1: Kintone に保存
    const recordId = await saveToKintone(name, email, content);

    // Step 2: Slack に通知
    await notifySlack(name, email, content, recordId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "処理に失敗しました" }, { status: 500 });
  }
}
