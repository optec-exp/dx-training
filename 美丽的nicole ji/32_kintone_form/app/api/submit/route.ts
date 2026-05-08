import { NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID = process.env.KINTONE_APP_ID!;
const API_TOKEN = process.env.KINTONE_API_TOKEN!;

export async function POST(req: Request) {
  try {
    const { name, email, content } = await req.json();

    const res = await fetch(
      `https://${SUBDOMAIN}.cybozu.com/k/v1/record.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Cybozu-API-Token": API_TOKEN,
        },
        body: JSON.stringify({
          app: APP_ID,
          record: {
            Name: { value: name },
            Email: { value: email },
            content: { value: content },
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error("Kintone error:", err);
      return NextResponse.json({ error: "写入失败" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
