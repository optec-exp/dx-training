import * as XLSX from "xlsx";
import { writeFileSync } from "node:fs";
const rows = [
  ["收款人", "上海天艳国际货物运输代理有限公司 SHANGHAI TIANYAN"],
  ["币种", "CNY"],
  [],
  ["Job No.", "提单号 MAWB", "TOTAL"],
  ["205-33595601", "205-33595601", 1980],
];
const ws = XLSX.utils.aoa_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "bill");
XLSX.writeFile(wb, "scripts/_test-bl.xlsx");
console.log("written scripts/_test-bl.xlsx");
