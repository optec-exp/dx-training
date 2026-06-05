import { getSupabaseAdmin } from "./supabase-server";

// 内控审计：记录系统内的关账/解锁/预算/人数等写操作（谁/何时/做了什么）。
export async function logAudit(动作: string, 对象类型: string, 对象id: string, 变更后: unknown, 用户 = "system"): Promise<void> {
  try {
    const sb = getSupabaseAdmin();
    const 利润月 = (变更后 as Record<string, unknown>)?.["期间"] || (变更后 as Record<string, unknown>)?.["month"] || null;
    await sb.from("audit_logs").insert({ 用户, 动作, 对象类型, 对象id, 变更后: 变更后 as object, 利润月: 利润月 as string | null });
  } catch { /* 审计失败不阻断主流程 */ }
}

export interface AuditRow { 时间: string; 用户: string; 动作: string; 对象类型: string; 对象id: string }
export async function getRecentAudit(limit = 20): Promise<AuditRow[]> {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("audit_logs").select("时间,用户,动作,对象类型,对象id").order("时间", { ascending: false }).limit(limit);
  return (data ?? []) as unknown as AuditRow[];
}
