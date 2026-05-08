import { NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID = process.env.KINTONE_APP_ID!;
const API_TOKEN = process.env.KINTONE_API_TOKEN!;

type CsvRow = { id: string; Name: string; Email: string; content: string };

export async function POST(req: Request) {
  try {
    const { records }: { records: CsvRow[] } = await req.json();

    let success = 0;
    let failure = 0;
    const errors: string[] = [];

    // Kintone は1回最大100件まで一括更新できる
    const CHUNK = 100;
    for (let i = 0; i < records.length; i += CHUNK) {
      const chunk = records.slice(i, i + CHUNK);

      const kintoneRecords = chunk.map((row) => ({
        id: row.id,
        record: {
          Name: { value: row.Name },
          Email: { value: row.Email },
          content: { value: row.content },
        },
      }));

      const res = await fetch(
        `https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Cybozu-API-Token": API_TOKEN,
          },
          body: JSON.stringify({ app: APP_ID, records: kintoneRecords }),
        }
      );

      if (res.ok) {
        success += chunk.length;
      } else {
        const err = await res.json();
        failure += chunk.length;
        errors.push(err.message ?? "不明エラー");
      }
    }

    return NextResponse.json({ success, failure, errors });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
