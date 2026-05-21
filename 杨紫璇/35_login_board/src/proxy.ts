import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // 匹配所有路由，但排除：
    // - _next/static (静态文件)
    // - _next/image (图片优化)
    // - favicon.ico
    // - 各种图片格式
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
