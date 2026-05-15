import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// ─── Kintone 凭证 ───────────────────────────────────────────
const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID    = process.env.KINTONE_APP_ID!;
const TOKEN     = process.env.KINTONE_API_TOKEN!;

// ─── Supabase（用 service_role key，有写入权限）──────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── 从 Kintone 拉取所有记录（每次最多 500 条）──────────────
async function fetchAllKintoneRecords() {
  const fields = [
    "$id", "当社案件番号", "顧客名", "案件テーマ",
    "操作ステータス", "Mode", "ETD", "ETA", "AWB_NO",
  ];

  let allRecords: Record<string, { value: string }>[] = [];
  let offset = 0;

  // Kintone 每次最多返回 500 条，用 while 循环分页拉完所有数据
  while (true) {
    const url = new URL(`https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`);
    url.searchParams.set("app", APP_ID);
    url.searchParams.set("query", `order by $id asc limit 500 offset ${offset}`);
    fields.forEach((f) => url.searchParams.append("fields[]", f));

    const res = await fetch(url.toString(), {
      headers: { "X-Cybozu-API-Token": TOKEN },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Kintone 请求失败: ${res.status}`);

    const data = await res.json();
    const records = data.records as Record<string, { value: string }>[];

    allRecords = allRecords.concat(records);

    // 如果这次返回的数量不足 500，说明已经是最后一页
    if (records.length < 500) break;
    offset += 500;
  }

  return allRecords;
}

// ─── POST /api/sync ──────────────────────────────────────────
export async function POST() {
  try {
    // ① 从 Kintone 拉取所有记录
    const kintoneRecords = await fetchAllKintoneRecords();

    // ② 预先获取 Supabase 中已存在的 kintone_id，用于区分新增/更新
    const { data: existingData } = await supabase
      .from("kintone_records")
      .select("kintone_id");
    const existingIdSet = new Set((existingData ?? []).map((r) => r.kintone_id));

    let inserted = 0;
    let updated  = 0;
    let failed   = 0;
    const insertedIds: string[] = [];
    const updatedIds: string[]  = [];
    const failedIds: string[]   = [];

    // ③ 逐条处理：差量更新
    for (const r of kintoneRecords) {
      const kintoneId = r["$id"].value;
      const isNew     = !existingIdSet.has(kintoneId);

      // 整理要写入 Supabase 的数据
      const row = {
        kintone_id:    kintoneId,
        case_number:   r["当社案件番号"]?.value ?? "",
        customer_name: r["顧客名"]?.value ?? "",
        theme:         r["案件テーマ"]?.value ?? "",
        status:        r["操作ステータス"]?.value ?? "",
        mode:          r["Mode"]?.value ?? "",
        etd:           r["ETD"]?.value ?? "",
        eta:           r["ETA"]?.value ?? "",
        awb_no:        r["AWB_NO"]?.value ?? "",
        synced_at:     new Date().toISOString(),
      };

      // upsert = INSERT（新记录）或 UPDATE（已存在）
      // onConflict: "kintone_id" → 如果 kintone_id 已存在就更新
      const { error } = await supabase
        .from("kintone_records")
        .upsert(row, { onConflict: "kintone_id" });

      if (error) {
        console.error(`记录 ${kintoneId} 同步失败:`, error.message);
        failedIds.push(kintoneId);
        failed++;
      } else if (isNew) {
        insertedIds.push(kintoneId);
        inserted++;
      } else {
        updatedIds.push(kintoneId);
        updated++;
      }
    }

    // ④ 返回同步结果日志（含各类别的 ID 列表，供前端点击查看）
    return NextResponse.json({
      success: true,
      total:    kintoneRecords.length,
      inserted,
      updated,
      failed,
      insertedIds,
      updatedIds,
      failedIds,
      synced_at: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "未知错误" },
      { status: 500 }
    );
  }
}
