import { getSupabaseAdmin } from "./supabase-server";

// JP DESK 中日人数（用于利润中日拆分）。无录入则回退默认 13/11。
export async function getJpdeskHeads(month: string): Promise<{ cn: number; jp: number }> {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("headcounts").select("部门小组,人数").eq("期间", month).in("部门小组", ["JP DESK中国", "JP DESK日本"]);
  let cn = 0, jp = 0;
  for (const r of (data ?? []) as Record<string, unknown>[]) {
    if (r["部门小组"] === "JP DESK中国") cn = Number(r["人数"]) || 0;
    if (r["部门小组"] === "JP DESK日本") jp = Number(r["人数"]) || 0;
  }
  if (!cn && !jp) return { cn: 13, jp: 11 };
  return { cn, jp };
}

export async function listHeadcounts(): Promise<{ 期间: string; cn: number; jp: number }[]> {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("headcounts").select("*").in("部门小组", ["JP DESK中国", "JP DESK日本"]);
  const m = new Map<string, { cn: number; jp: number }>();
  for (const r of (data ?? []) as Record<string, unknown>[]) {
    const p = String(r["期间"]); const e = m.get(p) || { cn: 0, jp: 0 };
    if (r["部门小组"] === "JP DESK中国") e.cn = Number(r["人数"]) || 0;
    if (r["部门小组"] === "JP DESK日本") e.jp = Number(r["人数"]) || 0;
    m.set(p, e);
  }
  return [...m].map(([期间, v]) => ({ 期间, ...v })).sort((a, b) => b.期间.localeCompare(a.期间));
}
