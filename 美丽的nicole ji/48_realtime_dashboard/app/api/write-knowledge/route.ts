import { NextResponse } from "next/server";

type KintoneRecord = {
  case_number?: string;
  customer_name?: string;
  status?: string;
  mode?: string;
  eta?: string;
  awb_no?: string;
};

export async function POST(req: Request) {
  const { record } = await req.json() as { record: KintoneRecord };

  const subdomain = process.env.KNOWLEDGE_BASE_SUBDOMAIN;
  const appId     = process.env.KNOWLEDGE_BASE_APP_ID;
  const token     = process.env.KNOWLEDGE_BASE_API_TOKEN;

  if (!subdomain || !appId || !token) {
    return NextResponse.json({ ok: false, error: "知识库环境变量未设置" });
  }

  // 生成写入内容
  const title   = `[仪表盘] ${record.case_number || "未知案件"}`;
  const content = [
    `案件番号: ${record.case_number   || "—"}`,
    `客户名:   ${record.customer_name || "—"}`,
    `状态:     ${record.status        || "—"}`,
    `Mode:     ${record.mode          || "—"}`,
    `ETA:      ${record.eta           || "—"}`,
    `AWB:      ${record.awb_no        || "—"}`,
  ].join("\n");

  const body = {
    app: Number(appId),
    record: {
      主题:    { value: title },
      詳細内容: { value: content },
      関連案件号: { value: record.case_number || "" },
    },
  };

  try {
    const res = await fetch(`https://${subdomain}.cybozu.com/k/v1/record.json`, {
      method: "POST",
      headers: {
        "X-Cybozu-API-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.id) {
      return NextResponse.json({ ok: true, id: data.id });
    } else {
      return NextResponse.json({ ok: false, error: data }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
