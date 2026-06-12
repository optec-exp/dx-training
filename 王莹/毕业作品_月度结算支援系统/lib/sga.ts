import { getSupabaseAdmin } from "./supabase-server";

// 贩管费聚合（净利用）。役員関連費用按中日 5/5 分；其余按部署地域；除外项不计。
export interface SgaAgg {
  total: number; // 全社贩管费（非除外）
  china: number; // 含役員 5/5
  japan: number;
  byCategory: Record<string, number>; // 5 类合计
  yakuin: number; // 役員関連費用 合计
  unmappedNonZero: { 部门: string; 金额: number }[]; // 未映射且金额≠0（数据质量）
}

const FEE5 = ["人件費", "事業活動費", "事業維持費", "人材·IT投資", "役員関連費用"];
export const FEE4 = ["人件費", "事業活動費", "事業維持費", "人材·IT投資"] as const; // 部门级不含役員(役員只在全社/中日 5/5)

// 按部门 × 费用类型聚合（非除外，不含役員）。用于业务部门/管理部门的费用结构。
export async function getSgaByDeptCategory(month: string): Promise<Map<string, Record<string, number>>> {
  const sb = getSupabaseAdmin();
  const map = new Map<string, Record<string, number>>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("sg_a_lines").select("部门,费用类型,金额").eq("期间", month).eq("是否除外", false).neq("费用类型", "役員関連費用").range(from, from + 999);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    for (const r of rows) {
      const dept = String(r["部门"]);
      const cat = String(r["费用类型"] ?? "");
      let e = map.get(dept); if (!e) { e = {}; map.set(dept, e); }
      e[cat] = (e[cat] || 0) + (Number(r["金额"]) || 0);
    }
    if (rows.length < 1000) break;
  }
  return map;
}

// 按部门聚合贩管费（非除外），用于小组损益。
export async function getSgaByDept(month: string): Promise<Map<string, number>> {
  const sb = getSupabaseAdmin();
  const map = new Map<string, number>();
  for (let from = 0; ; from += 1000) {
    // 小组层不列役員関連費用（DESIGN）
    const { data, error } = await sb.from("sg_a_lines").select("部门,金额").eq("期间", month).eq("是否除外", false).neq("费用类型", "役員関連費用").range(from, from + 999);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Record<string, unknown>[];
    for (const r of rows) map.set(String(r["部门"]), (map.get(String(r["部门"])) || 0) + (Number(r["金额"]) || 0));
    if (rows.length < 1000) break;
  }
  return map;
}

export async function getSgaForMonth(month: string): Promise<SgaAgg> {
  const sb = getSupabaseAdmin();
  // PostgREST 默认上限 1000 行，sg_a_lines 一个月可能数千行 → 分页拉全量。
  const data: Record<string, unknown>[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data: page, error } = await sb
      .from("sg_a_lines")
      .select("*")
      .eq("期间", month)
      .eq("是否除外", false)
      .range(from, from + size - 1);
    if (error) throw new Error(`读取 sg_a_lines 失败: ${error.message}`);
    data.push(...((page ?? []) as Record<string, unknown>[]));
    if (!page || page.length < size) break;
  }

  let total = 0, china = 0, japan = 0, yakuin = 0;
  const byCategory: Record<string, number> = {};
  for (const f of FEE5) byCategory[f] = 0;
  const unmapped = new Map<string, number>();

  for (const r of data ?? []) {
    const row = r as Record<string, unknown>;
    const amt = Number(row["金额"]) || 0;
    const cat = String(row["费用类型"] ?? "");
    const region = row["region"] as string | null;
    total += amt;
    if (cat in byCategory) byCategory[cat] += amt;
    if (cat === "役員関連費用") {
      yakuin += amt; // 稍后 5/5 拆
    } else if (region === "中国") china += amt;
    else if (region === "日本") japan += amt;
    else if (region == null) unmapped.set(String(row["部门"] ?? ""), (unmapped.get(String(row["部门"] ?? "")) || 0) + amt);
  }
  china += yakuin * 0.5;
  japan += yakuin * 0.5;

  return {
    total,
    china,
    japan,
    byCategory,
    yakuin,
    unmappedNonZero: [...unmapped].filter(([, a]) => Math.abs(a) > 0.5).map(([部门, 金额]) => ({ 部门: 部门.trim() || "(未填部署名)", 金额 })),
  };
}
