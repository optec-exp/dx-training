import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { computeStats } from "@/lib/stats";
import { buildAnalysisPrompt, ANALYSIS_RESPONSE_SCHEMA, type AnalysisResult } from "@/lib/prompt";
import { callGeminiStructured } from "@/lib/gemini";

const DEFAULT_FROM = "2025-06-01";
const DEFAULT_TO   = "2026-05-31";
const MODEL = "gemini-2.5-flash";

export const dynamic = "force-dynamic";
export const maxDuration = 60;  // Gemini 调用可能稍慢

export async function POST(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? DEFAULT_FROM;
  const to   = url.searchParams.get("to")   ?? DEFAULT_TO;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 GEMINI_API_KEY 环境变量" }, { status: 500 });
  }

  try {
    const sb = getSupabaseAdmin();
    const stats = await computeStats(sb, { from, to });

    const prompt = buildAnalysisPrompt(stats);
    const { parsed, raw, model } = await callGeminiStructured<AnalysisResult>({
      apiKey,
      model: MODEL,
      prompt,
      responseSchema: ANALYSIS_RESPONSE_SCHEMA,
    });

    // 落库
    const { data: report, error } = await sb
      .from("ex41_analysis_reports")
      .insert({
        period_start: from,
        period_end: to,
        summary: parsed.summary,
        anomalies: parsed.anomalies,
        trends: parsed.trends,
        recommendations: parsed.recommendations,
        stats,
        ai_model: model,
        raw_ai_output: raw,
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({
      reportId: report.id,
      model,
      analysis: parsed,
    });
  } catch (e) {
    console.error("[/api/analyze] failed:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
