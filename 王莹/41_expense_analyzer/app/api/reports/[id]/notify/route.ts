import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { notifyReportToSlack } from "@/lib/slack";
import type { AnalysisReportRow } from "@/lib/google-docs";

export const dynamic = "force-dynamic";

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

    await notifyReportToSlack(report as AnalysisReportRow);
    return NextResponse.json({ ok: true, reportId: id });
  } catch (e) {
    console.error("[/api/reports/[id]/notify] failed:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
