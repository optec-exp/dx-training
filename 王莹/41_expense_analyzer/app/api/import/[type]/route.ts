import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { validateExpensesCSV, validateBudgetsCSV } from "@/lib/csv-import";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALL = "00000000-0000-0000-0000-000000000000";

export async function POST(req: Request, ctx: { params: Promise<{ type: string }> }) {
  const { type } = await ctx.params;
  if (type !== "expenses" && type !== "budgets") {
    return NextResponse.json({ error: "type 必须是 expenses 或 budgets" }, { status: 400 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry_run") === "1";
  const replace = url.searchParams.get("replace") === "1";

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) return NextResponse.json({ error: "缺少 file 字段" }, { status: 400 });
    if (file.size === 0) return NextResponse.json({ error: "文件为空" }, { status: 400 });
    if (file.size > 5_000_000) return NextResponse.json({ error: "文件超过 5MB，请拆分" }, { status: 400 });
    const text = await file.text();

    const sb = getSupabaseAdmin();
    const { data: cats, error: ce } = await sb.from("ex41_categories").select("id, code, name");
    if (ce) throw ce;
    if (!cats?.length) return NextResponse.json({ error: "ex41_categories 表为空（请先建表 + 跑 seed）" }, { status: 500 });

    const catMap = new Map<string, string>();
    for (const c of cats) { catMap.set(c.code, c.id); catMap.set(c.name, c.id); }
    const validCodes = cats.map(c => c.code);

    const tableName = type === "expenses" ? "ex41_expenses" : "ex41_budgets";

    if (type === "expenses") {
      const { records, errors, dataRows } = validateExpensesCSV(text, catMap, validCodes);
      const preview = records.slice(0, 3);

      if (dryRun) {
        return NextResponse.json({ dryRun: true, total: dataRows, valid: records.length, errors, preview });
      }
      if (errors.length > 0) {
        return NextResponse.json({ error: "CSV 有错误，请先修正再导入", total: dataRows, valid: records.length, errors }, { status: 400 });
      }
      if (replace) {
        const { error } = await sb.from(tableName).delete().neq("id", ALL);
        if (error) throw error;
      }
      const chunkSize = 500;
      let inserted = 0;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const { error } = await sb.from(tableName).insert(chunk);
        if (error) throw error;
        inserted += chunk.length;
      }
      return NextResponse.json({ dryRun: false, total: dataRows, inserted, replaced: replace, errors: [] });
    }

    // budgets
    const { records, errors, dataRows } = validateBudgetsCSV(text, catMap);
    const preview = records.slice(0, 3);

    if (dryRun) {
      return NextResponse.json({ dryRun: true, total: dataRows, valid: records.length, errors, preview });
    }
    if (errors.length > 0) {
      return NextResponse.json({ error: "CSV 有错误，请先修正再导入", total: dataRows, valid: records.length, errors }, { status: 400 });
    }
    if (replace) {
      const { error } = await sb.from(tableName).delete().neq("id", ALL);
      if (error) throw error;
    }
    const { error: upErr } = await sb.from(tableName).upsert(records, { onConflict: "category_id,period" });
    if (upErr) throw upErr;
    return NextResponse.json({ dryRun: false, total: dataRows, inserted: records.length, replaced: replace, errors: [] });
  } catch (e) {
    console.error(`[/api/import/${type}] failed:`, e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
