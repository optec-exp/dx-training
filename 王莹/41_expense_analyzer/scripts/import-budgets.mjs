// CSV → ex41_budgets 批量导入（同类目同月已有则更新，upsert 语义）
// 用法：
//   node --env-file=.env.local scripts/import-budgets.mjs <csv-file> [--replace] [--dry-run]
// 必需列：period (YYYY-MM 或 YYYY-MM-DD), category, budget_amount
// category 可填中文名 或 code

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith("--"));
const replace = args.includes("--replace");
const dryRun = args.includes("--dry-run");

if (!file) {
  console.error("用法: node --env-file=.env.local scripts/import-budgets.mjs <csv-file> [--replace] [--dry-run]");
  process.exit(1);
}
if (!fs.existsSync(file)) { console.error(`找不到文件: ${file}`); process.exit(1); }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("缺少 SUPABASE 环境变量"); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ""; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === '\r') {}
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// "2025-06" / "2025-6" / "2025-06-01" 统一成 "2025-MM-01"
function normalizePeriod(s) {
  const m = s.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, "0")}-01`;
}

const raw = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
const rows = parseCSV(raw).filter(r => r.some(c => c.trim()));
if (rows.length < 2) { console.error("CSV 为空或只有表头"); process.exit(1); }

const [header, ...data] = rows;
const cols = header.map(c => c.trim().toLowerCase());
const required = ["period", "category", "budget_amount"];
for (const r of required) {
  if (!cols.includes(r)) { console.error(`缺少必需列: ${r}（实际列: ${cols.join(",")}）`); process.exit(1); }
}
const idx = {
  period: cols.indexOf("period"),
  category: cols.indexOf("category"),
  budget_amount: cols.indexOf("budget_amount"),
};

const { data: cats, error: ce } = await sb.from("ex41_categories").select("id, code, name");
if (ce) { console.error("查询类目失败:", ce.message); process.exit(1); }
if (!cats?.length) { console.error("ex41_categories 表为空"); process.exit(1); }
const catMap = new Map();
for (const c of cats) { catMap.set(c.code, c.id); catMap.set(c.name, c.id); }

const records = [];
const errors = [];
data.forEach((row, i) => {
  const lineNum = i + 2;
  const periodRaw = row[idx.period]?.trim();
  const catRaw = row[idx.category]?.trim();
  const amountRaw = row[idx.budget_amount]?.trim();

  if (!periodRaw || !catRaw || !amountRaw) { errors.push(`第 ${lineNum} 行: 必填字段缺失`); return; }
  const period = normalizePeriod(periodRaw);
  if (!period) { errors.push(`第 ${lineNum} 行: 月份格式错误（应 YYYY-MM）: ${periodRaw}`); return; }
  const categoryId = catMap.get(catRaw);
  if (!categoryId) { errors.push(`第 ${lineNum} 行: 未知类目 "${catRaw}"`); return; }
  const amount = Number(amountRaw.replace(/[,\s¥￥]/g, ""));
  if (!Number.isFinite(amount) || amount < 0) { errors.push(`第 ${lineNum} 行: 金额无效: ${amountRaw}`); return; }

  records.push({ category_id: categoryId, period, budget_amount: amount });
});

console.log(`CSV 共 ${data.length} 行 → 有效 ${records.length} / 错误 ${errors.length}`);
if (errors.length) {
  console.log("\n错误清单（前 20 条）:");
  errors.slice(0, 20).forEach(e => console.log("  ✗ " + e));
}

if (dryRun) {
  console.log("\n[--dry-run] 仅校验，不写入。");
  process.exit(errors.length ? 1 : 0);
}
if (errors.length) { console.error("\n存在错误，已中止。"); process.exit(1); }
if (!records.length) { console.error("\n没有有效记录。"); process.exit(1); }

if (replace) {
  console.log("\n[--replace] 删除 ex41_budgets 全部记录...");
  const { error } = await sb.from("ex41_budgets").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) { console.error("清空失败:", error.message); process.exit(1); }
}

// upsert：同 (category_id, period) 已有则更新
console.log(`\n开始 upsert ${records.length} 条...`);
const { error } = await sb.from("ex41_budgets").upsert(records, { onConflict: "category_id,period" });
if (error) { console.error("✗ upsert 失败:", error.message); process.exit(1); }
console.log(`\n✓ 导入完成，共 ${records.length} 条（同 类目×月 已有则更新）`);
