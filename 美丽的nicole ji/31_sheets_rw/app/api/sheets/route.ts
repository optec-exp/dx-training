import { google } from "googleapis";
import { NextResponse } from "next/server";

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

// 自动获取第一个 Sheet 的名称
async function getFirstSheetName(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  return meta.data.sheets?.[0]?.properties?.title ?? "Sheet1";
}

// GET — 读取数据
export async function GET() {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const sheetName = await getFirstSheetName(sheets, SHEET_ID);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A:C`,
    });
    const rows = res.data.values ?? [];
    return NextResponse.json({ rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "读取失败" }, { status: 500 });
  }
}

// POST — 写入数据
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, content } = body;
    const date = new Date().toLocaleDateString("ja-JP");

    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const sheetName = await getFirstSheetName(sheets, SHEET_ID);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A:C`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, content, date]],
      },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "写入失败" }, { status: 500 });
  }
}
