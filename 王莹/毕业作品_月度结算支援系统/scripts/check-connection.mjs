// 连接自测（零依赖，Node 18+ 自带 fetch）。
// 用途：验证 Supabase 连接 + settlement schema 已 expose + 客户端能访问其中的表。
// 运行：node scripts/check-connection.mjs
// 注意：只从 .env.local 读取密钥，绝不打印密钥本身。

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- 简易 .env.local 解析（支持 KEY=VALUE、忽略注释/空行）---
function loadEnv() {
  const env = {};
  let text;
  try {
    text = readFileSync(join(root, ".env.local"), "utf8");
  } catch {
    console.error("❌ 找不到 .env.local —— 请先从 .env.local.example 复制并填写 Supabase 信息。");
    process.exit(1);
  }
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("❌ .env.local 缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY。");
  process.exit(1);
}
console.log(`→ 目标：${url}（schema = settlement）`);

// 通过 PostgREST 查 settlement schema 下的 bills 表（Accept-Profile 指定 schema）。
// 期望：HTTP 200，返回空数组 []（表存在、可访问、暂无数据）。
const res = await fetch(`${url}/rest/v1/bills?select=id&limit=1`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Accept-Profile": "settlement",
  },
});

const body = await res.text();

if (res.status === 200) {
  console.log("✅ 连接成功：settlement.bills 可访问，返回", body || "[]");
  console.log("   → Supabase 接入准备完成。");
} else {
  process.exitCode = 1;
  console.error(`❌ 失败 HTTP ${res.status}`);
  console.error("   响应：", body);
  if (res.status === 403) {
    console.error("   提示：settlement schema 未授权给 service_role —— 请在 SQL Editor 运行 db/schema.sql 末尾的 GRANT 段。");
  } else if (body.includes("schema") || res.status === 406) {
    console.error("   提示：可能 settlement 还没 expose，或 schema/表未建。请检查 Data API → Exposed schemas。");
  }
}
