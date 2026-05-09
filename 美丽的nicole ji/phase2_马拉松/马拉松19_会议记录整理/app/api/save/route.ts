import { NextResponse } from "next/server";

interface ActionItem {
  task: string;
  owner: string;
  due: string;
}

export async function POST(req: Request) {
  const body = await req.json() as {
    date: string;
    title: string;
    location: string;
    attendees: string;
    agenda: string;
    decisions: string;
    action_items: ActionItem[];
    next_meeting: string;
  };

  const kintoneUrl = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1/record.json`;

  // アクションアイテムをテキスト形式にまとめる
  const actionText = body.action_items
    .map((a, i) => `${i + 1}. ${a.task}（担当: ${a.owner || "-"}、期日: ${a.due || "-"}）`)
    .join("\n");

  const record = {
    meeting_date: { value: body.date },
    meeting_title: { value: body.title },
    meeting_location: { value: body.location },
    attendees: { value: body.attendees },
    agenda: { value: body.agenda },
    decisions: { value: body.decisions },
    action_items: { value: actionText },
    next_meeting: { value: body.next_meeting },
  };

  const res = await fetch(kintoneUrl, {
    method: "POST",
    headers: {
      "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ app: process.env.KINTONE_APP_ID, record }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: `Kintone 保存失败：${err?.message ?? res.status}` },
      { status: 500 }
    );
  }

  const data = await res.json();
  return NextResponse.json({ id: data.id, saved: true });
}
