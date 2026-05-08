import { NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID = process.env.KINTONE_APP_ID!;
const API_TOKEN = process.env.KINTONE_API_TOKEN!;

export async function GET() {
  try {
    const res = await fetch(
      `https://${SUBDOMAIN}.cybozu.com/k/v1/records.json?app=${APP_ID}&fields[0]=\$id&fields[1]=client&fields[2]=case_name&fields[3]=amount&fields[4]=note`,
      {
        headers: { "X-Cybozu-API-Token": API_TOKEN },
      }
    );
    if (!res.ok) throw new Error("Kintone 读取失败");
    const data = await res.json();

    const cases = data.records.map((r: Record<string, { value: string }>) => ({
      id: r["$id"].value,
      client: r.client?.value ?? "",
      case_name: r.case_name?.value ?? "",
      amount: r.amount?.value ?? "0",
      note: r.note?.value ?? "",
    }));

    return NextResponse.json({ cases });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "读取失败" }, { status: 500 });
  }
}
