import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 服务端 Supabase 客户端（service_role key，绕过 RLS）。
// 仅在 server components / route handlers / scripts 中使用，绝不能在浏览器侧导入。
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 环境变量");
  }
  // db.schema = 'settlement'：本系统所有表都在独立 schema，与同 project 内其它作品隔离。
  return createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: "settlement" },
  });
}
