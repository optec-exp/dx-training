import { createClient } from "jsr:@supabase/supabase-js@2";

// ── 环境变量（在 Supabase 后台设置）──────────────────────────
const SUBDOMAIN = Deno.env.get("KINTONE_SUBDOMAIN")!;
const APP_ID    = Deno.env.get("KINTONE_APP_ID")!;
const TOKEN     = Deno.env.get("KINTONE_API_TOKEN")!;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ── Kintone から全レコードを取得 ──────────────────────────────
async function fetchAllKintoneRecords() {
  const fields = [
    "$id", "当社案件番号", "顧客名", "案件テーマ",
    "操作ステータス", "Mode", "ETD", "ETA", "AWB_NO",
  ];

  let allRecords: Record<string, { value: string }>[] = [];
  let offset = 0;

  while (true) {
    const url = new URL(`https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`);
    url.searchParams.set("app", APP_ID);
    url.searchParams.set("query", `order by $id asc limit 500 offset ${offset}`);
    fields.forEach((f) => url.searchParams.append("fields[]", f));

    const res = await fetch(url.toString(), {
      headers: { "X-Cybozu-API-Token": TOKEN },
    });

    if (!res.ok) throw new Error(`Kintone 请求失败: ${res.status}`);

    const data = await res.json();
    const records = data.records as Record<string, { value: string }>[];
    allRecords = allRecords.concat(records);

    if (records.length < 500) break;
    offset += 500;
  }

  return allRecords;
}

// ── Edge Function 入口 ────────────────────────────────────────
Deno.serve(async () => {
  try {
    const kintoneRecords = await fetchAllKintoneRecords();

    let inserted = 0;
    let failed   = 0;

    for (const r of kintoneRecords) {
      const row = {
        kintone_id:    r["$id"].value,
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

      const { error } = await supabase
        .from("kintone_records")
        .upsert(row, { onConflict: "kintone_id" });

      if (error) { failed++; } else { inserted++; }
    }

    const result = {
      success: true,
      total: kintoneRecords.length,
      inserted,
      failed,
      synced_at: new Date().toISOString(),
    };

    console.log("[Edge Function] 同步完成:", result);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[Edge Function] 同步失败:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
