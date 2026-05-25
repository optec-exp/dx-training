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
    "操作ステータス", "Transport_Type表示", "Transport_Type",
    "Mode", "Business_Scope",
    "輸出対応チーム", "輸入対応チーム",
    "ETD", "ETA", "AWB_NO",
    "特記事項_通関向け",
    "貨物追跡テーブル",  // 子表：货物追踪
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allRecords: Record<string, any>[] = [];
  let offset = 0;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records = data.records as Record<string, any>[];
    allRecords = allRecords.concat(records);

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

    // ② 预先获取已存在的 kintone_id，区分新增/更新
    const { data: existingData } = await supabase
      .from("cases")
      .select("kintone_id");
    const existingIdSet = new Set((existingData ?? []).map((r) => r.kintone_id));

    let inserted = 0;
    let updated  = 0;
    let failed   = 0;

    // ③ 逐条 upsert
    for (const r of kintoneRecords) {
      const kintoneId = r["$id"].value;
      const isNew     = !existingIdSet.has(kintoneId);

      // 从货物追踪子表中提取第一行的预定日时
      // Kintone API 返回 UTC，转成日本时间(+9h)后只取日期部分存储
      const trackingTable = r["貨物追跡テーブル"]?.value as
        | { value: Record<string, { value: string }> }[]
        | undefined;
      const rawTracking =
        trackingTable?.[0]?.value?.["tracking_scheduled_at"]?.value || null;
      let firstTrackingDate: string | null = null;
      if (rawTracking) {
        const jst = new Date(new Date(rawTracking).getTime() + 9 * 60 * 60 * 1000);
        // 只存日期 "2026-05-06"，避免 TIMESTAMPTZ 自动转回 UTC
        firstTrackingDate = jst.toISOString().slice(0, 10);
      }

      const row = {
        kintone_id:            kintoneId,
        case_number:           r["当社案件番号"]?.value ?? "",
        customer_name:         r["顧客名"]?.value ?? "",
        theme:                 r["案件テーマ"]?.value ?? "",
        status:                r["操作ステータス"]?.value ?? "",
        mode:                  r["Transport_Type表示"]?.value ?? "",
        service_type:          r["Transport_Type"]?.value ?? "",
        transport_mode:        r["Mode"]?.value ?? "",
        business_scope:        r["Business_Scope"]?.value ?? "",
        export_team:           r["輸出対応チーム"]?.value ?? "",
        import_team:           r["輸入対応チーム"]?.value ?? "",
        etd:                   r["ETD"]?.value || null,
        eta:                   r["ETA"]?.value || null,
        awb_no:                r["AWB_NO"]?.value ?? "",
        notes:                 r["特記事項_通関向け"]?.value ?? "",
        latest_tracking_date:  firstTrackingDate,
        synced_at:             new Date().toISOString(),
      };

      const { error } = await supabase
        .from("cases")
        .upsert(row, { onConflict: "kintone_id" });

      if (error) {
        console.error(`记录 ${kintoneId} 同步失败:`, error.message);
        failed++;
      } else if (isNew) {
        inserted++;
      } else {
        updated++;
      }
    }

    // ④ 写入同步日志
    await supabase.from("sync_logs").insert({
      event_type: "SYNC",
      summary: `同步完成: 共${kintoneRecords.length}条, 新增${inserted}, 更新${updated}, 失败${failed}`,
      detail: { total: kintoneRecords.length, inserted, updated, failed },
    });

    return NextResponse.json({
      success: true,
      total: kintoneRecords.length,
      inserted,
      updated,
      failed,
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
