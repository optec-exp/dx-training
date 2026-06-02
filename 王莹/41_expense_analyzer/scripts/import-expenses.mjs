// CSV → ex41_expenses 批量导入
// 用法：
//   node --env-file=.env.local scripts/import-expenses.mjs <csv-file> [--replace] [--dry-run]
// 必需列：date, category, department, amount
// 可选列：vendor, description
// category 可填中文名（"业务维持费"）或 code（"maintenance"）
// --dry-run：只校验不写入
// --replace：写入前清空 ex41_expenses 全部记录

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith("--"));
const replace = args.includes("--replace");
const dryRun = args.includes("--dry-run");

if (!file) {
  console.error("用法: node --env-file=.env.local scripts/import-expenses.mjs <csv-file> [--replace] [--dry-run]");
  process.exit(1);
}
if (!fs.existsSync(file)) { console.error(`找不到文件: ${file}`); process.exit(1); }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("缺少 SUPABASE 环境变量"); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

// 简易 CSV 解析（支持双引号包裹/转义）
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
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const raw = fs.readFileSync(file, "utf8").replace(/^﻿/, ""); // 去 BOM
const rows = parseCSV(raw).filter(r => r.some(c => c.trim()));
if (rows.length < 2) { console.error("CSV 为空或只有表头"); process.exit(1); }

const [header, ...data] = rows;
const cols = header.map(c => c.trim().toLowerCase());
const required = ["date", "category", "department", "amount"];
for (const r of required) {
  if (!cols.includes(r)) { console.error(`缺少必需列: ${r}（实际列: ${cols.join(",")}）`); process.exit(1); }
}
const idx = {
  date: cols.indexOf("date"),
  category: cols.indexOf("category"),
  department: cols.indexOf("department"),
  vendor: cols.indexOf("vendor"),
  amount: cols.indexOf("amount"),
  description: cols.indexOf("description"),
};

// 加载类目映射（code + 中文名 都可作为 key）
const { data: cats, error: ce } = await sb.from("ex41_categories").select("id, code, name");
if (ce) { console.error("查询类目失败:", ce.message); process.exit(1); }
if (!cats?.length) { console.error("ex41_categories 表为空——请先跑 schema.sql + seed.mjs"); process.exit(1); }
const catMap = new Map();
for (const c of cats) { catMap.set(c.code, c.id); catMap.set(c.name, c.id); }

// 转换 + 校验
const records = [];
const errors = [];
data.forEach((row, i) => {
  const lineNum = i + 2;
  const date = row[idx.date]?.trim();
  const catRaw = row[idx.category]?.trim();
  const dept = row[idx.department]?.trim();
  const vendor = idx.vendor >= 0 ? row[idx.vendor]?.trim() : "";
  const amountRaw = row[idx.amount]?.trim();
  const desc = idx.description >= 0 ? row[idx.description]?.trim() : "";

  if (!date || !catRaw || !dept || !amountRaw) { errors.push(`第 ${lineNum} 行: 必填字段缺失`); return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { errors.push(`第 ${lineNum} 行: 日期格式错误（应 YYYY-MM-DD）: ${date}`); return; }
  const categoryId = catMap.get(catRaw);
  if (!categoryId) { errors.push(`第 ${lineNum} 行: 未知类目 "${catRaw}"（应为中文名 或 code: ${cats.map(c => c.code).join("/")}）`); return; }
  const amount = Number(amountRaw.replace(/[,\s¥￥]/g, ""));
  if (!Number.isFinite(amount) || amount < 0) { errors.push(`第 ${lineNum} 行: 金额无效: ${amountRaw}`); return; }

  records.push({
    category_id: categoryId,
    expense_date: date,
    department: dept,
    vendor: vendor || null,
    amount,
    description: desc || null,
  });
});

console.log(`CSV 共 ${data.length} 行 → 有效 ${records.length} / 错误 ${errors.length}`);
if (errors.length) {
  console.log("\n错误清单（前 20 条）:");
  errors.slice(0, 20).forEach(e => console.log("  ✗ " + e));
}

if (dryRun) {
  console.log("\n[--dry-run] 仅校验，不写入。");
  if (records.length) {
    console.log(`\n样例（前 3 条记录将这样插入）:`);
    records.slice(0, 3).forEach((r, i) => console.log(`  ${i + 1}. ${r.expense_date} ${r.department} ${r.vendor ?? "-"} ¥${r.amount.toLocaleString("ja-JP")} -- ${r.description ?? ""}`));
  }
  process.exit(errors.length ? 1 : 0);
}
if (errors.length) { console.error("\n存在错误，已中止。请修正 CSV 后重试，或先 --dry-run 排查。"); process.exit(1); }
if (!records.length) { console.error("\n没有有效记录。"); process.exit(1); }

if (replace) {
  console.log("\n[--replace] 删除 ex41_expenses 全部记录...");
  const { error } = await sb.from("ex41_expenses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) { console.error("清空失败:", error.message); process.exit(1); }
}

console.log(`\n开始插入 ${records.length} 条...`);
const chunkSize = 500;
let total = 0;
for (let i = 0; i < records.length; i += chunkSize) {
  const chunk = records.slice(i, i + chunkSize);
  const { error } = await sb.from("ex41_expenses").insert(chunk);
  if (error) { console.error(`✗ 第 ${i + 1}-${i + chunk.length} 条插入失败:`, error.message); process.exit(1); }
  total += chunk.length;
  console.log(`  ${total} / ${records.length}`);
}
console.log(`\n✓ 导入完成，共 ${total} 条`);
