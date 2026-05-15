import { NextRequest, NextResponse } from "next/server";

const KINTONE_BASE = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1`;
const KINTONE_TOKEN = process.env.KINTONE_API_TOKEN!;
const KINTONE_APP = process.env.KINTONE_APP_ID!;
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL!;
const SHEETS_WEBHOOK = process.env.SHEETS_WEBHOOK_URL!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Unicode escapes: 申请人姓名 = 申请人姓名
  const applicantName: string   = body["申请人姓名"];
  const company: string         = body["所属公司"];
  const department: string      = body["所属部门"];
  const position: string        = body["申请人职位"];
  const expenseCategory: string = body["费用项目"];
  const itemName: string        = body["物品名称"];
  const quantity: string        = body["数量"];
  const amount: string          = body["预估金额"];
  const payee: string           = body["收款方"];
  const paymentMethod: string   = body["支付方式"];
  const reason: string          = body["申请理由"];

  const today = new Date().toISOString().split("T")[0];

  // Step 1: Register in Kintone
  console.log("[STEP 1] Kintone...");
  let recordId: string;
  try {
    const kintoneRes = await fetch(`${KINTONE_BASE}/record.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Cybozu-API-Token": KINTONE_TOKEN,
      },
      body: JSON.stringify({
        app: KINTONE_APP,
        record: {
          "依赖类型": { value: "販管费申请" },
          "所属公司": { value: company },
          "所属部门": { value: department },
          "申请人职位": { value: position },
          "备注_0": { value: applicantName },
          "费用用途": { value: reason },
          "支払方法": { value: paymentMethod },
          "申请时间": { value: today },
          "テーブル": {
            value: [{
              value: {
                "物品名称": { value: itemName },
                "数量": { value: Number(quantity) },
                "预估物品费用": { value: Number(amount) },
                "販管费发票": { value: "无" },
              },
            }],
          },
        },
      }),
    });
    const kintoneData = await kintoneRes.json();
    if (!kintoneRes.ok) {
      console.error("[STEP 1] failed:", kintoneData);
      return NextResponse.json({ success: false, error: `Kintone error: ${kintoneData.message}`, details: kintoneData.errors }, { status: 500 });
    }
    recordId = kintoneData.id;
    console.log(`[STEP 1] OK - Record ID: ${recordId}`);
  } catch (e) {
    console.error("[STEP 1] connection error:", e);
    return NextResponse.json({ success: false, error: "Kintone connection error" }, { status: 500 });
  }

  const approveUrl = `${BASE_URL}/approve/${recordId}`;

  // Step 2: Slack notification
  console.log("[STEP 2] Slack...");
  try {
    const slackRes = await fetch(SLACK_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `New expense request from ${applicantName}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*販管费申请*\n\n*申请者:* ${applicantName}(${department})\n*费用项目:* ${expenseCategory}\n*内容:* ${itemName} x ${quantity}\n*金额:* CNY ${Number(amount).toLocaleString()}\n*收款方:* ${payee}\n*申请理由:* ${reason}`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "Approve" },
                style: "primary",
                url: approveUrl,
              },
            ],
          },
        ],
      }),
    });
    if (!slackRes.ok) {
      console.warn(`[STEP 2] Slack failed: ${slackRes.status}`);
    } else {
      console.log("[STEP 2] Slack OK");
    }
  } catch (e) {
    console.warn("[STEP 2] Slack error (continuing):", e);
  }

  // Step 3: Google Sheets ledger
  console.log("[STEP 3] Google Sheets...");
  try {
    const sheetsRes = await fetch(SHEETS_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        action: "append",
        date: today,
        name: applicantName,
        dept: department,
        item: `${expenseCategory}|${itemName}`,
        amount: Number(amount),
        payee: payee,
        paymethod: paymentMethod,
        reason: reason,
      }),
    });
    const sheetsData = await sheetsRes.json().catch(() => ({}));
    if ((sheetsData as { ok?: boolean }).ok) {
      console.log("[STEP 3] Sheets OK");
    } else {
      console.warn("[STEP 3] Sheets failed:", sheetsData);
    }
  } catch (e) {
    console.warn("[STEP 3] Sheets error (continuing):", e);
  }

  console.log(`[DONE] Record ID: ${recordId}`);
  return NextResponse.json({ success: true, recordId });
}
