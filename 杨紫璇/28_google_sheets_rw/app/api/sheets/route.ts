import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const CLIENT_EMAIL   = process.env.GOOGLE_CLIENT_EMAIL!;
const PRIVATE_KEY    = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
const RANGE          = "A:F";

function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

// GET: read all rows
export async function GET() {
  try {
    const sheets = getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });
    const rows = res.data.values ?? [];
    return NextResponse.json({ rows });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST: append one row
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 日付, 顧客名, AWB番号, カテゴリ, 内容, ステータス } = body;

    const sheets = getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[日付, 顧客名, AWB番号 ?? "", カテゴリ ?? "", 内容, ステータス ?? "未対応"]],
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
