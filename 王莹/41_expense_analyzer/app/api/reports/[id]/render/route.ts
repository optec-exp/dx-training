import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { renderReportToGoogleDoc, type AnalysisReportRow } from "@/lib/google-docs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const sb = getSupabaseAdmin();
    const { data: report, error } = await sb
      .from("ex41_analysis_reports")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    if (!report) return NextResponse.json({ error: "report not found" }, { status: 404 });

    const { docId, docUrl } = await renderReportToGoogleDoc(report as AnalysisReportRow);

    // 回写 doc 链接到报告记录
    const { error: upErr } = await sb
      .from("ex41_analysis_reports")
      .update({ google_doc_id: docId, google_doc_url: docUrl })
      .eq("id", id);
    if (upErr) throw upErr;

    return NextResponse.json({ reportId: id, docId, docUrl });
  } catch (e) {
    console.error("[/api/reports/[id]/render] failed:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
