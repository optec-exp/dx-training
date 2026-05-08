import { google } from "googleapis";
import { NextResponse } from "next/server";

const TEMPLATE_ID = process.env.GOOGLE_DOCS_TEMPLATE_ID!;

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
}

export async function POST(req: Request) {
  try {
    const { client, case_name, amount, note } = await req.json();
    const date = new Date().toLocaleDateString("zh-CN");

    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });

    // 模板を HTML としてエクスポート（コピー不要・ストレージ使用なし）
    const res = await drive.files.export(
      { fileId: TEMPLATE_ID, mimeType: "text/html" },
      { responseType: "text" }
    );

    let html = res.data as string;

    // 占位符を置換
    html = html
      .replace(/\{\{客户名\}\}/g, client)
      .replace(/\{\{案件名\}\}/g, case_name)
      .replace(/\{\{金额\}\}/g, Number(amount).toLocaleString())
      .replace(/\{\{备注\}\}/g, note)
      .replace(/\{\{日期\}\}/g, date);

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: unknown) {
    const e = err as { message?: string; response?: { data?: unknown } };
    console.error("ERROR:", e.message);
    return NextResponse.json({ error: "生成失败", detail: e.message }, { status: 500 });
  }
}
