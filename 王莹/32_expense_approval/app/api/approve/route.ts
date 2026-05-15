import { NextRequest, NextResponse } from "next/server";

const KINTONE_BASE = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1`;
const KINTONE_TOKEN = process.env.KINTONE_API_TOKEN!;
const KINTONE_APP = process.env.KINTONE_APP_ID!;
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL!;
const SHEETS_WEBHOOK = process.env.SHEETS_WEBHOOK_URL!;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const recordId: string = body.recordId;
  const decision: string = body.decision;
  const comment: string = body.comment ?? "";
  const applicantName: string = body.applicantName ?? "";
  const applyDate: string = body.applyDate ?? "";

  const decisionLabel = decision === "approve" ? "承認済" : "却下";
  const resultText = `${decisionLabel}${comment ? `\nコメント：${comment}` : ""}`;

  // Step 1: Update Kintone 处理结果
  console.log(`[STEP 1] Kintone update - ID: ${recordId}, decision: ${decisionLabel}`);
  try {
    const res = await fetch(`${KINTONE_BASE}/record.json`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Cybozu-API-Token": KINTONE_TOKEN,
      },
      body: JSON.stringify({
        app: KINTONE_APP,
        id: recordId,
        record: {
          "处理结果": { value: resultText },
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[STEP 1] failed:", data);
      return NextResponse.json({ success: false, error: `Kintone error: ${data.message}` }, { status: 500 });
    }
    console.log("[STEP 1] OK");
  } catch (e) {
    console.error("[STEP 1] connection error:", e);
    return NextResponse.json({ success: false, error: "Kintone connection error" }, { status: 500 });
  }

  // Step 2: Update Google Sheets status
  console.log("[STEP 2] Google Sheets update...");
  console.log(`[STEP 2] applicantName=${applicantName}, applyDate=${applyDate}`);
  try {
    const sheetsRes = await fetch(SHEETS_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        action: "update",
        date: applyDate,
        name: applicantName,
        status: decisionLabel,
      }),
    });
    const sheetsData = await sheetsRes.json().catch(() => ({}));
    if ((sheetsData as { ok?: boolean }).ok) {
      console.log("[STEP 2] Sheets OK");
    } else {
      console.warn("[STEP 2] Sheets failed:", sheetsData);
    }
  } catch (e) {
    console.warn("[STEP 2] Sheets error (continuing):", e);
  }

  // Step 3: Slack completion notification
  console.log("[STEP 3] Slack notification...");
  const emoji = decision === "approve" ? "✅" : "❌";
  try {
    await fetch(SLACK_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `${emoji} Expense request #${recordId} ${decisionLabel}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${emoji} *审批结果通知*\n\n*申请者:* ${applicantName}\n*申请番号:* #${recordId}\n*结果:* *${decisionLabel}*${comment ? `\n*评论:* ${comment}` : ""}`,
            },
          },
        ],
      }),
    });
    console.log("[STEP 3] Slack OK");
  } catch (e) {
    console.warn("[STEP 3] Slack error (continuing):", e);
  }

  console.log(`[DONE] Record ID: ${recordId}, decision: ${decisionLabel}`);
  return NextResponse.json({ success: true, decision: decisionLabel });
}
