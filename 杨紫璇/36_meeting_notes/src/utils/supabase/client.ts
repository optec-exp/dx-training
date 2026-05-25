import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// 本项目暂时无 Auth，所以不需要 @supabase/ssr 的 cookie 同步逻辑
// 同一个 client 既可在 Server Component / Route Handler 用，也可在 Client Component 用
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
