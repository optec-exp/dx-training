import { google } from "googleapis";
import { NextResponse } from "next/server";

const TEMPLATE_ID = process.env.GOOGLE_DOCS_TEMPLATE_ID!;

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

export async function DELETE() {
  try {
    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });

    // サービスアカウントが所有するファイルを全て取得
    const res = await drive.files.list({
      q: `'me' in owners and trashed = false`,
      fields: "files(id, name)",
      pageSize: 1000,
    });

    const files = res.data.files ?? [];
    // テンプレート以外を削除
    const targets = files.filter((f) => f.id !== TEMPLATE_ID);

    await Promise.all(
      targets.map((f) => drive.files.delete({ fileId: f.id! }).catch(() => {}))
    );

    return NextResponse.json({ deleted: targets.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "清理失败" }, { status: 500 });
  }
}
