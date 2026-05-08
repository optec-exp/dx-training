import { NextResponse } from "next/server";
import { google } from "googleapis";

// 生成案件番号：CASE-YYYYMMDD-随机4位
function generateCaseNo(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `CASE-${date}-${rand}`;
}

// 获取 Google Drive 认证
function getDriveAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

// 在 Drive 中创建文件夹，返回文件夹ID
async function createFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId: string
): Promise<string> {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });
  return res.data.id!;
}

export async function POST(req: Request) {
  try {
    const { case_name, client, assignee, amount } = await req.json();

    // 验证必填项
    if (!case_name || !client || !assignee || !amount) {
      return NextResponse.json({ error: "所有字段均为必填项" }, { status: 400 });
    }

    const case_no = generateCaseNo();

    // ① 保存到 Kintone
    const kintoneUrl = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1/record.json`;
    const kintoneRes = await fetch(kintoneUrl, {
      method: "POST",
      headers: {
        "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app: process.env.KINTONE_APP_ID,
        record: {
          case_no: { value: case_no },
          case_name: { value: case_name },
          client: { value: client },
          assignee: { value: assignee },
          amount: { value: Number(amount) },
          status: { value: "受付中" },
        },
      }),
    });

    if (!kintoneRes.ok) {
      const err = await kintoneRes.text();
      console.error("Kintone error:", err);
      return NextResponse.json({ error: "Kintone 保存失败: " + err }, { status: 500 });
    }

    // ② 在 Google Drive 创建案件文件夹结构
    let folderUrl = "";
    const parentId = process.env.GOOGLE_DRIVE_PARENT_ID;
    if (parentId && parentId !== "YOUR_DRIVE_FOLDER_ID") {
      const auth = getDriveAuth();
      const drive = google.drive({ version: "v3", auth });

      // 主文件夹：案件名
      const mainFolderId = await createFolder(drive, `${case_no}_${case_name}`, parentId);
      // 子文件夹：AWB、通关、发票
      await Promise.all([
        createFolder(drive, "AWB", mainFolderId),
        createFolder(drive, "通关", mainFolderId),
        createFolder(drive, "发票", mainFolderId),
      ]);
      folderUrl = `https://drive.google.com/drive/folders/${mainFolderId}`;
    }

    // ③ 发送 Slack 通知
    const mentionId = process.env.SLACK_MENTION_USER_ID;
    const mention =
      mentionId && mentionId !== "YOUR_SLACK_USER_ID"
        ? `<@${mentionId}>`
        : assignee;

    const slackMessage = {
      text: `新案件已接单 🎉`,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "📦 新案件已接单" },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*案件番号：*\n${case_no}` },
            { type: "mrkdwn", text: `*案件名：*\n${case_name}` },
            { type: "mrkdwn", text: `*客户名：*\n${client}` },
            { type: "mrkdwn", text: `*负责人：*\n${mention}` },
            { type: "mrkdwn", text: `*金额：*\n¥${Number(amount).toLocaleString()}` },
          ],
        },
        ...(folderUrl
          ? [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `📁 <${folderUrl}|打开 Drive 文件夹>`,
                },
              },
            ]
          : []),
      ],
    };

    const slackRes = await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackMessage),
    });

    if (!slackRes.ok) {
      console.error("Slack error:", await slackRes.text());
      // Slack 失败不阻止整体流程，继续返回成功
    }

    return NextResponse.json({
      success: true,
      case_no,
      folder_url: folderUrl || null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
