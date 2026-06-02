// 作品41 种子数据脚本：生成 12 个月、4 类目的费用明细 + 月度预算，写入 Supabase。
// 运行：node --env-file=.env.local scripts/seed.mjs
// 用 service_role key（自动绕过 RLS）。可重复运行：每次先清空本作品 ex41_ 数据再重灌。

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY，请确认 .env.local");
  process.exit(1);
}
const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

// 过去 12 个月（每月第一天）
const months = [
  "2025-06-01", "2025-07-01", "2025-08-01", "2025-09-01", "2025-10-01", "2025-11-01",
  "2025-12-01", "2026-01-01", "2026-02-01", "2026-03-01", "2026-04-01", "2026-05-01",
];

const categories = [
  { code: "maintenance", name: "业务维持费", description: "除其他三类外，日常办公产生的一切花销（房租、水电、办公用品、通信、维修、日常差旅等）", sort_order: 1 },
  { code: "activity",    name: "业务活动费", description: "参展的一切花费、公司运营的一切宣传费（展会、广告投放、市场推广物料）", sort_order: 2 },
  { code: "personnel",   name: "人件费",     description: "工资、奖金、社会保险", sort_order: 3 },
  { code: "talent_it",   name: "人才·IT投资", description: "员工学习产生的一切费用、IT方面的一切花费（培训、软件订阅、云服务、IT硬件）", sort_order: 4 },
];

// 月度目标总额（日元）。index 与 months 对应。各类目刻意做出不同"性格"。
const targets = {
  // 人件费：稳定基数 + 夏(7月)/冬(12月)奖金尖峰 + 新年度(4月)小幅上调
  personnel:   [8000000, 14000000, 8050000, 8050000, 8100000, 8100000, 14600000, 8200000, 8200000, 8250000, 8300000, 8300000],
  // 业务维持费：基本平稳 + 2025-11 一次性空调维修异常
  maintenance: [1180000, 1220000, 1150000, 1260000, 1210000, 2700000, 1240000, 1190000, 1230000, 1280000, 1300000, 1260000],
  // 业务活动费：展会月尖峰(2025-09/2026-03) + 广告基数下半年走高
  activity:    [600000, 650000, 680000, 3100000, 720000, 760000, 800000, 820000, 860000, 3700000, 900000, 920000],
  // 人才·IT投资：逐月上升趋势 + 2026-01 一次性 ERP 许可异常
  talent_it:   [400000, 430000, 470000, 520000, 560000, 610000, 660000, 3700000, 760000, 820000, 880000, 920000],
};

// 月度预算（日元）
const budgets = {
  personnel:   months.map((_, i) => (i === 1 || i === 6 ? 14800000 : 8200000)), // 奖金月预算调高
  maintenance: months.map(() => 1300000),
  activity:    months.map((_, i) => (i === 3 ? 3000000 : i === 9 ? 3200000 : 700000)), // 展会月预算调高
  talent_it:   months.map(() => 700000),
};

// 各类目常规明细模板（weight 之和 = 100）
const recurring = {
  maintenance: [
    { desc: "办公室房租", vendor: "丸之内不动产", dept: "管理部", weight: 50, day: 25 },
    { desc: "水电燃气费", vendor: "东京电力", dept: "管理部", weight: 18, day: 10 },
    { desc: "办公用品采购", vendor: "ASKUL", dept: "管理部", weight: 12, day: 18 },
    { desc: "电话及网络通信费", vendor: "NTT东日本", dept: "管理部", weight: 20, day: 20 },
  ],
  activity: [
    { desc: "搜索引擎广告投放", vendor: "Google Ads", dept: "营业部", weight: 45, day: 15 },
    { desc: "社交媒体推广", vendor: "Meta", dept: "营业部", weight: 35, day: 20 },
    { desc: "宣传物料制作", vendor: "博报堂印刷", dept: "营业部", weight: 20, day: 8 },
  ],
  personnel: [
    { desc: "正式员工工资（营业）", vendor: null, dept: "营业部", weight: 35, day: 25 },
    { desc: "正式员工工资（技术）", vendor: null, dept: "技术部", weight: 30, day: 25 },
    { desc: "正式员工工资（管理）", vendor: null, dept: "管理部", weight: 20, day: 25 },
    { desc: "社会保险公司负担部分", vendor: "健康保险组合", dept: "管理部", weight: 15, day: 28 },
  ],
  talent_it: [
    { desc: "云服务器及存储", vendor: "AWS", dept: "技术部", weight: 35, day: 5 },
    { desc: "软件订阅（办公/设计）", vendor: "Microsoft 365", dept: "技术部", weight: 30, day: 5 },
    { desc: "员工技能培训", vendor: "外部培训机构", dept: "管理部", weight: 20, day: 12 },
    { desc: "IT硬件采购", vendor: "戴尔", dept: "技术部", weight: 15, day: 18 },
  ],
};

// 特殊月份的一次性/尖峰明细（从该月总额中切出，剩余按常规模板分摊）
function special(code, i) {
  if (code === "maintenance" && i === 5) return { amount: 1500000, desc: "办公室中央空调系统紧急维修", vendor: "设备维修服务", dept: "管理部", day: 14 };
  if (code === "activity" && i === 3)    return { amount: 2500000, desc: "秋季产业展 展位费及搭建", vendor: "产业展主办方", dept: "营业部", day: 16 };
  if (code === "activity" && i === 9)    return { amount: 3000000, desc: "春季国际展 展位费及物料", vendor: "国际展主办方", dept: "营业部", day: 12 };
  if (code === "personnel" && i === 1)   return { amount: 6000000, desc: "夏季奖金", vendor: null, dept: "管理部", day: 10 };
  if (code === "personnel" && i === 6)   return { amount: 6600000, desc: "冬季奖金", vendor: null, dept: "管理部", day: 10 };
  if (code === "talent_it" && i === 7)   return { amount: 3000000, desc: "新一代ERP系统软件许可（年度）", vendor: "ERP供应商", dept: "技术部", day: 20 };
  return null;
}

const round1000 = (n) => Math.round(n / 1000) * 1000;

// 按权重把总额拆成多笔；末笔吃掉余数，保证精确求和
function splitRecurring(templates, total) {
  const items = [];
  let acc = 0;
  templates.forEach((t, idx) => {
    let amt;
    if (idx === templates.length - 1) amt = total - acc;
    else { amt = round1000((total * t.weight) / 100); acc += amt; }
    items.push({ ...t, amount: amt });
  });
  return items;
}

function dateStr(monthStart, day) {
  const d = new Date(monthStart + "T00:00:00Z");
  d.setUTCDate(day);
  return d.toISOString().slice(0, 10);
}

const ALL = "00000000-0000-0000-0000-000000000000"; // 删除占位（neq 匹配所有真实行）

async function main() {
  // 清空本作品旧数据（FK 安全顺序：明细 → 预算 → 类目）
  await sb.from("ex41_expenses").delete().neq("id", ALL);
  await sb.from("ex41_budgets").delete().neq("id", ALL);
  await sb.from("ex41_categories").delete().neq("id", ALL);

  // 类目
  const { data: cats, error: e1 } = await sb.from("ex41_categories").insert(categories).select();
  if (e1) throw e1;
  const idByCode = Object.fromEntries(cats.map((c) => [c.code, c.id]));

  // 预算
  const budgetRows = [];
  for (const code of Object.keys(budgets)) {
    months.forEach((m, i) => budgetRows.push({ category_id: idByCode[code], period: m, budget_amount: budgets[code][i] }));
  }
  const { error: e2 } = await sb.from("ex41_budgets").insert(budgetRows);
  if (e2) throw e2;

  // 费用明细
  const expenseRows = [];
  for (const code of Object.keys(targets)) {
    months.forEach((m, i) => {
      const total = targets[code][i];
      const sp = special(code, i);
      const items = splitRecurring(recurring[code], sp ? total - sp.amount : total);
      if (sp) items.push(sp);
      for (const it of items) {
        expenseRows.push({
          category_id: idByCode[code],
          expense_date: dateStr(m, it.day ?? 15),
          department: it.dept,
          vendor: it.vendor ?? null,
          amount: it.amount,
          description: it.desc,
        });
      }
    });
  }
  const { error: e3 } = await sb.from("ex41_expenses").insert(expenseRows);
  if (e3) throw e3;

  // —— 验证：从 DB 实查行数 ——
  const head = { count: "exact", head: true };
  const { count: catCount } = await sb.from("ex41_categories").select("*", head);
  const { count: budCount } = await sb.from("ex41_budgets").select("*", head);
  const { count: expCount } = await sb.from("ex41_expenses").select("*", head);
  console.log(`DB 实查行数 — 类目:${catCount}  预算:${budCount}  明细:${expCount}`);

  // 抽查：2025-11 业务维持费应=2,700,000（含一次性维修异常）
  const { data: nov } = await sb
    .from("ex41_expenses")
    .select("amount, description")
    .eq("category_id", idByCode["maintenance"])
    .gte("expense_date", "2025-11-01")
    .lt("expense_date", "2025-12-01");
  const novSum = nov.reduce((s, r) => s + Number(r.amount), 0);
  console.log(`抽查 2025-11 业务维持费合计: ${novSum.toLocaleString()} 円（应=2,700,000），共 ${nov.length} 笔`);

  // 逐月实际/预算概览（万円；⚠ 标超支月）
  console.log("\n各类目逐月  实际/预算（万円，⚠=超支）：");
  for (const c of categories) {
    const line = months.map((m, i) => {
      const a = targets[c.code][i], b = budgets[c.code][i];
      return `${m.slice(0, 7)}:${(a / 10000).toFixed(0)}/${(b / 10000).toFixed(0)}${a > b ? "⚠" : ""}`;
    });
    console.log(`\n[${c.name}]\n  ${line.join("  ")}`);
  }
}

main()
  .then(() => { console.log("\n✓ 种子数据写入完成"); process.exit(0); })
  .catch((e) => { console.error("✗ 失败:", e.message || e); process.exit(1); });
