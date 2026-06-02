// 共享 CSV 解析 + 校验逻辑（供 API 路由和 CLI 脚本复用）。
// 纯函数，不依赖 Supabase——调用方负责加载 category 映射并执行写入。

export type CSVError = { line: number; message: string };

export type ExpenseRecord = {
  category_id: string;
  expense_date: string;
  department: string;
  vendor: string | null;
  amount: number;
  description: string | null;
};

export type BudgetRecord = {
  category_id: string;
  period: string;
  budget_amount: number;
};

// 简易 CSV 解析（支持双引号包裹/转义；忽略 \r 与 BOM）
export function parseCSV(text: string): string[][] {
  const cleaned = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (inQuotes) {
      if (c === '"' && cleaned[i + 1] === '"') { field += '"'; i++; }
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

function normalizePeriod(s: string): string | null {
  const m = s.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, "0")}-01`;
}

function parseAmount(s: string): number | null {
  const cleaned = s.replace(/[,\s¥￥]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function checkHeader(rows: string[][], required: string[]): { cols: string[]; idx: Record<string, number> } | CSVError {
  if (rows.length < 2) return { line: 0, message: "CSV 为空或只有表头" };
  const cols = rows[0].map(c => c.trim().toLowerCase());
  for (const r of required) {
    if (!cols.includes(r)) return { line: 1, message: `缺少必需列: ${r}（实际列: ${cols.join(",")}）` };
  }
  const idx: Record<string, number> = {};
  for (const r of required) idx[r] = cols.indexOf(r);
  return { cols, idx };
}

export function validateExpensesCSV(
  text: string,
  categoryMap: Map<string, string>,
  validCodes: string[]
): { records: ExpenseRecord[]; errors: CSVError[]; dataRows: number } {
  const rows = parseCSV(text).filter(r => r.some(c => c.trim()));
  const required = ["date", "category", "department", "amount"];
  const headerResult = checkHeader(rows, required);
  if ("line" in headerResult) return { records: [], errors: [headerResult], dataRows: 0 };

  const cols = headerResult.cols;
  const idx = {
    date: cols.indexOf("date"),
    category: cols.indexOf("category"),
    department: cols.indexOf("department"),
    vendor: cols.indexOf("vendor"),
    amount: cols.indexOf("amount"),
    description: cols.indexOf("description"),
  };

  const data = rows.slice(1);
  const records: ExpenseRecord[] = [];
  const errors: CSVError[] = [];

  data.forEach((row, i) => {
    const lineNum = i + 2;
    const date = row[idx.date]?.trim();
    const catRaw = row[idx.category]?.trim();
    const dept = row[idx.department]?.trim();
    const vendor = idx.vendor >= 0 ? row[idx.vendor]?.trim() : "";
    const amountRaw = row[idx.amount]?.trim();
    const desc = idx.description >= 0 ? row[idx.description]?.trim() : "";

    if (!date || !catRaw || !dept || !amountRaw) {
      errors.push({ line: lineNum, message: "必填字段缺失（date/category/department/amount）" });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push({ line: lineNum, message: `日期格式错误（应 YYYY-MM-DD）: ${date}` });
      return;
    }
    const categoryId = categoryMap.get(catRaw);
    if (!categoryId) {
      errors.push({ line: lineNum, message: `未知类目 "${catRaw}"（应为中文名或 code: ${validCodes.join("/")}）` });
      return;
    }
    const amount = parseAmount(amountRaw);
    if (amount === null) {
      errors.push({ line: lineNum, message: `金额无效: ${amountRaw}` });
      return;
    }
    records.push({
      category_id: categoryId,
      expense_date: date,
      department: dept,
      vendor: vendor || null,
      amount,
      description: desc || null,
    });
  });

  return { records, errors, dataRows: data.length };
}

export function validateBudgetsCSV(
  text: string,
  categoryMap: Map<string, string>
): { records: BudgetRecord[]; errors: CSVError[]; dataRows: number } {
  const rows = parseCSV(text).filter(r => r.some(c => c.trim()));
  const required = ["period", "category", "budget_amount"];
  const headerResult = checkHeader(rows, required);
  if ("line" in headerResult) return { records: [], errors: [headerResult], dataRows: 0 };

  const cols = headerResult.cols;
  const idx = {
    period: cols.indexOf("period"),
    category: cols.indexOf("category"),
    budget_amount: cols.indexOf("budget_amount"),
  };

  const data = rows.slice(1);
  const records: BudgetRecord[] = [];
  const errors: CSVError[] = [];

  data.forEach((row, i) => {
    const lineNum = i + 2;
    const periodRaw = row[idx.period]?.trim();
    const catRaw = row[idx.category]?.trim();
    const amountRaw = row[idx.budget_amount]?.trim();

    if (!periodRaw || !catRaw || !amountRaw) {
      errors.push({ line: lineNum, message: "必填字段缺失（period/category/budget_amount）" });
      return;
    }
    const period = normalizePeriod(periodRaw);
    if (!period) {
      errors.push({ line: lineNum, message: `月份格式错误（应 YYYY-MM）: ${periodRaw}` });
      return;
    }
    const categoryId = categoryMap.get(catRaw);
    if (!categoryId) {
      errors.push({ line: lineNum, message: `未知类目 "${catRaw}"` });
      return;
    }
    const amount = parseAmount(amountRaw);
    if (amount === null) {
      errors.push({ line: lineNum, message: `金额无效: ${amountRaw}` });
      return;
    }
    records.push({ category_id: categoryId, period, budget_amount: amount });
  });

  return { records, errors, dataRows: data.length };
}
