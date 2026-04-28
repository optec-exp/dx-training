// 从 OurAirports 公开数据集下载并处理机场数据
// 运行方式：node scripts/fetch-airports.mjs

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const AIRPORTS_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv";
const COUNTRIES_URL = "https://davidmegginson.github.io/ourairports-data/countries.csv";

const CONTINENT_MAP = {
  AF: "非洲",
  AN: "南极洲",
  AS: "亚洲",
  EU: "欧洲",
  NA: "北美",
  OC: "大洋洲",
  SA: "南美",
};

function parseCSV(text) {
  const lines = text.split("\n");
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

async function fetchText(url) {
  console.log(`正在下载: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`下载失败: ${res.status} ${url}`);
  return res.text();
}

async function main() {
  // 下载数据
  const [airportsCsv, countriesCsv] = await Promise.all([
    fetchText(AIRPORTS_URL),
    fetchText(COUNTRIES_URL),
  ]);

  // 解析国家代码 → 英文名
  const countryRows = parseCSV(countriesCsv);
  const countryMap = {};
  for (const row of countryRows) {
    if (row.code && row.name) {
      countryMap[row.code] = row.name.replace(/^"/, "").replace(/"$/, "");
    }
  }

  // 解析机场
  const airportRows = parseCSV(airportsCsv);
  console.log(`原始数据总行数: ${airportRows.length}`);

  const result = [];
  for (const row of airportRows) {
    const iata = row.iata_code?.trim();
    // 只保留有 IATA 代码的机场
    if (!iata || iata.length !== 3) continue;

    const icao = row.ident?.trim() ?? "";
    const nameEn = row.name?.trim() ?? "";
    const city = row.municipality?.trim() ?? "";
    const countryCode = row.iso_country?.trim() ?? "";
    const continent = row.continent?.trim() ?? "";
    const lat = parseFloat(row.latitude_deg) || 0;
    const lon = parseFloat(row.longitude_deg) || 0;
    const type = row.type?.trim() ?? "";

    // 过滤掉已关闭的机场
    if (type === "closed") continue;

    const country = countryMap[countryCode] ?? countryCode;
    const region = CONTINENT_MAP[continent] ?? continent;

    result.push({
      iata,
      icao,
      name_en: nameEn,
      city,
      country,
      country_code: countryCode,
      region,
      lat,
      lon,
    });
  }

  // 按 IATA 排序
  result.sort((a, b) => a.iata.localeCompare(b.iata));

  console.log(`有效机场数量（含 IATA 代码）: ${result.length}`);

  // 统计各区域数量
  const regionCount = {};
  for (const a of result) {
    regionCount[a.region] = (regionCount[a.region] ?? 0) + 1;
  }
  console.log("各区域分布:", regionCount);

  // 写入 public/airports.json
  const outPath = join(__dirname, "../public/airports.json");
  writeFileSync(outPath, JSON.stringify(result, null, 0), "utf-8");
  const size = (JSON.stringify(result).length / 1024).toFixed(1);
  console.log(`✓ 已写入 public/airports.json（${result.length} 条，${size} KB）`);
}

main().catch((err) => {
  console.error("错误:", err);
  process.exit(1);
});
