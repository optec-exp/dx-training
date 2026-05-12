import { NextRequest, NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID = process.env.KINTONE_APP_ID!;
const TOKEN = process.env.KINTONE_API_TOKEN!;

type SubmitBody = {
  費用項目: string;
  費用类型: string;
  費用: string;
  通貨: string;
  国別: string;
  取引日: string;
  支払期日: string;
  支払先: string;
  支払いチェック: boolean;
  支払日: string;
  支払額: string;
  支払方法: string;
};

export async function POST(req: NextRequest) {
  try {
    const body: SubmitBody = await req.json();

    // 必須チェック（Lookup フィールドは除外）
    const required: (keyof SubmitBody)[] = ["費用类型", "費用", "通貨", "取引日", "支払期日"];
    for (const field of required) {
      if (!body[field]?.toString().trim()) {
        return NextResponse.json({ error: `${field} は必須です` }, { status: 400 });
      }
    }

    const amount = Number(body.費用);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "費用には正の数値を入力してください" }, { status: 400 });
    }

    // Kintone レコードオブジェクトを構築（費用項目・支払先は Lookup のため除外）
    type KintoneValue = { value: string | number | boolean | string[] };
    const record: Record<string, KintoneValue> = {
      費用类型:   { value: body.費用类型 },
      費用:       { value: amount },
      通貨:       { value: body.通貨 },
      取引日:     { value: body.取引日 },
      支払期日:   { value: body.支払期日 },
      支払いチェック: { value: body.支払いチェック ? ["支払済み"] : [] },
    };

    // 任意フィールド（値があるときだけ送信）
    if (body.国別)    record.国別    = { value: body.国別 };
    if (body.支払日)  record.支払日  = { value: body.支払日 };
    if (body.支払方法 && body.支払方法 !== "-----") record.支払方法 = { value: body.支払方法 };
    if (body.支払額) {
      const 支払額 = Number(body.支払額);
      if (!isNaN(支払額) && 支払額 > 0) record.支払額 = { value: 支払額 };
    }

    const kintoneRes = await fetch(
      `https://${SUBDOMAIN}.cybozu.com/k/v1/record.json`,
      {
        method: "POST",
        headers: {
          "X-Cybozu-API-Token": TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ app: APP_ID, record }),
      }
    );

    const data = await kintoneRes.json();
    if (!kintoneRes.ok) {
      return NextResponse.json(
        { error: data.message ?? `Kintone エラー (${kintoneRes.status})` },
        { status: 502 }
      );
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
