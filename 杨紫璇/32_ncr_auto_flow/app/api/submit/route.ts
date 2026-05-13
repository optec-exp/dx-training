import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SUBDOMAIN     = process.env.KINTONE_SUBDOMAIN!;
const APP_ID        = process.env.KINTONE_APP_ID!;
const API_TOKEN     = process.env.KINTONE_API_TOKEN!;
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL!;
const SLACK_USER_ID = process.env.SLACK_ASSIGNEE_USER_ID!;
const PARENT_FOLDER = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID!;
const CLIENT_EMAIL  = process.env.GOOGLE_CLIENT_EMAIL!;
const PRIVATE_KEY   = (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/documents",
    ],
  });
}

async function postToKintone(body: Record<string, string>) {
  const record: Record<string, unknown> = {
    発生日時:     { value: body.発生日時 },
    報告問題:     { value: body.報告問題 },
    案件概要:     { value: body.案件概要 },
    NCR_発生分類: { value: body.NCR発生分類 },
    顧客苦情:     { value: body.顧客苦情 },
  };

  if (body.報告部署)  record.報告部署  = { value: body.報告部署 };
  if (body.発生部署名) record.部署名   = { value: body.発生部署名 };
  if (body.案件番号)  record.案件番号  = { value: body.案件番号 };

  // USER_SELECT: pass [{code: loginCode}]
  if (body.報告者コード)
    record.報告者 = { value: [{ code: body.報告者コード }] };
  if (body.発生部署部長コード)
    record.発生部署責任者 = { value: [{ code: body.発生部署部長コード }] };

  if (body.発生部署コード)
    record.発生部署 = { value: [{ code: body.発生部署コード }] };
  if (body.発生部署部長コード)
    record.発生部署部長 = { value: [{ code: body.発生部署部長コード }] };

  if (body.適用領域) record.輸送領域 = { value: body.適用領域 };

  const res = await fetch(`https://${SUBDOMAIN}.cybozu.com/k/v1/record.json`, {
    method: "POST",
    headers: {
      "X-Cybozu-API-Token": API_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ app: APP_ID, record }),
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) throw new Error(`Kintone error: ${JSON.stringify(data)}`);
  return String(data.id ?? "");
}

async function fetchNcrNumber(recordId: string): Promise<string> {
  const url = `https://${SUBDOMAIN}.cybozu.com/k/v1/record.json?app=${APP_ID}&id=${recordId}`;
  const res  = await fetch(url, { headers: { "X-Cybozu-API-Token": API_TOKEN } });
  const data = await res.json();
  const ncrNum = data.record?.NCR番号?.value as string | undefined;
  const recNum = data.record?.レコード番号?.value as string | undefined;
  return ncrNum || recNum || recordId;
}

async function createDriveFolder(ncrNumber: string) {
  const drive = google.drive({ version: "v3", auth: getAuth() });
  const folder = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: `NCR_${ncrNumber}`,
      mimeType: "application/vnd.google-apps.folder",
      parents: [PARENT_FOLDER],
    },
    fields: "id,webViewLink",
  });
  return { id: folder.data.id!, url: folder.data.webViewLink! };
}

async function createNcrDoc(folderId: string, body: Record<string, string>, ncrNumber: string) {
  const auth  = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const docs  = google.docs({ version: "v1", auth });

  const file = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: `NCR報告書_${ncrNumber}`,
      mimeType: "application/vnd.google-apps.document",
      parents: [folderId],
    },
    fields: "id,webViewLink",
  });

  const content = [
    "NCR 報告書",
    "",
    `NCR番号: ${ncrNumber}`,
    `発生日時: ${body.発生日時}`,
    `報告者: ${body.報告者コード}　（${body.報告部署 || "—"}）`,
    `発生部署: ${body.発生部署名 || "—"}　責任者: ${body.発生部署責任者コード || "—"}`,
    `報告問題区分: ${body.報告問題}　　NCR発生分類: ${body.NCR発生分類}`,
    `顧客苦情: ${body.顧客苦情}`,
    "",
    "【案件概要】",
    body.案件概要,
    "",
    "【是正処置】",
    "（記入欄）",
    "",
    "【再発防止策】",
    "（記入欄）",
    "",
    "【効果測定】",
    "（記入欄）",
  ].join("\n");

  await docs.documents.batchUpdate({
    documentId: file.data.id!,
    requestBody: {
      requests: [{ insertText: { location: { index: 1 }, text: content } }],
    },
  });

  return file.data.webViewLink!;
}

async function postToSlack(body: Record<string, string>, kintoneId: string, ncrNumber: string, folderUrl: string) {
  await fetch(SLACK_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "🚨 NCR 新規登録通知 | OPTEC", emoji: true },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${SLACK_USER_ID}> NCR が登録されました。対応をお願いします。`,
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*NCR番号*\n${ncrNumber}` },
            { type: "mrkdwn", text: `*発生日時*\n${body.発生日時}` },
            { type: "mrkdwn", text: `*報告者*\n${body.報告者コード}（${body.報告部署 || "—"}）` },
            { type: "mrkdwn", text: `*発生部署責任者*\n${body.発生部署責任者コード || "—"}` },
            { type: "mrkdwn", text: `*報告問題*\n${body.報告問題}　／　${body.NCR発生分類}` },
            { type: "mrkdwn", text: `*発生部署*\n${body.発生部署名 || "—"}` },
          ],
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: `*案件概要*\n${body.案件概要}` },
        },
        {
          type: "actions",
          elements: [{
            type: "button",
            text: { type: "plain_text", text: "📁 Drive フォルダを開く", emoji: true },
            url: folderUrl,
            style: "primary",
          }],
        },
        {
          type: "context",
          elements: [{
            type: "mrkdwn",
            text: `Kintone レコード ID: ${kintoneId} ｜ 登録: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
          }],
        },
      ],
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, string>;
    console.log("[submit] body:", JSON.stringify(body, null, 2));

    // 1. Kintone
    const kintoneId = await postToKintone(body);
    const ncrNumber = await fetchNcrNumber(kintoneId);

    // 2. Drive folder
    const folder = await createDriveFolder(ncrNumber);

    // 3. NCR Doc (best-effort)
    let docUrl = "";
    try {
      docUrl = await createNcrDoc(folder.id, body, ncrNumber);
    } catch (e) {
      console.warn("Doc creation skipped:", e);
    }

    // 4. Slack
    await postToSlack(body, kintoneId, ncrNumber, folder.url);

    return NextResponse.json({ kintoneId, ncrNumber, folderUrl: folder.url, docUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
