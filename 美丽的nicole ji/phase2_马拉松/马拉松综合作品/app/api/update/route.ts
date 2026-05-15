import { NextResponse } from "next/server";

type DetailItem = { awb: string; status: "updated" | "not_found" | "failed" };

export async function POST(req: Request) {
  const { awb_list, new_status }: { awb_list: string[]; new_status: string } = await req.json();
  if (!awb_list || awb_list.length === 0) {
    return NextResponse.json({ error: "AWB リストが空です" }, { status: 400 });
  }

  const subdomain = process.env.KINTONE_SUBDOMAIN!;
  const token = process.env.KINTONE_API_TOKEN!;
  const appId = process.env.KINTONE_APP_ID!;
  const baseUrl = `https://${subdomain}.cybozu.com/k/v1`;

  const details: DetailItem[] = [];
  let updated = 0;
  let notFound = 0;
  let failed = 0;

  for (const awb of awb_list) {
    // AWB番号でレコードを検索
    const query = encodeURIComponent(`awb_no = "${awb}"`);
    const searchUrl = `${baseUrl}/records.json?app=${appId}&query=${query}&fields[$id][$id]=true`;
    const searchRes = await fetch(searchUrl, {
      headers: { "X-Cybozu-API-Token": token },
      cache: "no-store",
    });

    if (!searchRes.ok) { details.push({ awb, status: "failed" }); failed++; continue; }
    const searchData = await searchRes.json();
    if (!searchData.records || searchData.records.length === 0) {
      details.push({ awb, status: "not_found" }); notFound++; continue;
    }

    // 見つかった全レコードのステータスを更新
    type KintoneRecord = Record<string, { value: string }>;
    const recordIds = searchData.records.map((r: KintoneRecord) => r.$id.value);
    const updateRecords = recordIds.map((id: string) => ({
      id,
      record: { status: { value: new_status } },
    }));

    const updateUrl = `${baseUrl}/records.json`;
    const updateRes = await fetch(updateUrl, {
      method: "PUT",
      headers: { "X-Cybozu-API-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({ app: appId, records: updateRecords }),
    });

    if (updateRes.ok) { details.push({ awb, status: "updated" }); updated++; }
    else { details.push({ awb, status: "failed" }); failed++; }
  }

  return NextResponse.json({ updated, not_found: notFound, failed, details });
}
