import { NextRequest, NextResponse } from "next/server";

const KINTONE_BASE = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1`;
const KINTONE_TOKEN = process.env.KINTONE_API_TOKEN!;
const KINTONE_APP = process.env.KINTONE_APP_ID!;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const res = await fetch(
      `${KINTONE_BASE}/record.json?app=${KINTONE_APP}&id=${id}`,
      { headers: { "X-Cybozu-API-Token": KINTONE_TOKEN } }
    );
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: false, error: data.message }, { status: 404 });
    }
    const r = data.record;
    return NextResponse.json({
      success: true,
      record: {
        id,
        申请人姓名: r.备注_0?.value ?? "",
        所属部门: r.所属部门?.value ?? "",
        费用项目: r.费用项目_0?.value ?? "",
        物品名称: r.テーブル?.value?.[0]?.value?.物品名称?.value ?? "",
        数量: r.テーブル?.value?.[0]?.value?.数量?.value ?? "",
        预估金额: r.テーブル?.value?.[0]?.value?.预估物品费用?.value ?? "",
        收款方: r.支払先?.value ?? "",
        支付方式: r.支払方法?.value ?? "",
        申请理由: r.费用用途?.value ?? "",
        申请时间: r.申请时间?.value ?? "",
        处理结果: r.处理结果?.value ?? "",
      },
    });
  } catch (e) {
    console.error("[GET record] エラー:", e);
    return NextResponse.json({ success: false, error: "取得失敗" }, { status: 500 });
  }
}
