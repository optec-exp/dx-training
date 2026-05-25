/**
 * 粗略估算 token 数。
 * - CJK 字符:1 字符 ≈ 1 token
 * - 其他可见字符:4 字符 ≈ 1 token
 * 实际值由分词器决定,这只是给用户一个数量级感受。
 */
export function estimateTokens(text: string): number {
  let cjk = 0
  let other = 0
  for (const ch of text) {
    const code = ch.codePointAt(0)!
    if (
      (code >= 0x4e00 && code <= 0x9fff) || // 汉字
      (code >= 0x3040 && code <= 0x309f) || // 平假名
      (code >= 0x30a0 && code <= 0x30ff) || // 片假名
      (code >= 0xac00 && code <= 0xd7af) // 韩文
    ) {
      cjk++
    } else if (!/\s/.test(ch)) {
      other++
    }
  }
  return Math.max(1, Math.ceil(cjk + other / 4))
}

/**
 * 把 Gemini / 网络 / Supabase 的英文错误,翻译成用户能看懂的中文。
 */
export function humanizeError(raw: string): string {
  // Gemini 配额耗尽
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('quota')) {
    return '今日 Gemini 免费额度已用尽。请等待明天 UTC 0 点(北京时间 8:00)重置,或升级到付费账号。'
  }
  // Gemini 临时过载
  if (raw.includes('UNAVAILABLE') || raw.includes('503')) {
    return 'Gemini 模型当前负载过高,请稍等几秒重试。'
  }
  // 网络错误
  if (raw.includes('Failed to fetch') || raw.includes('NetworkError')) {
    return '网络连接失败。检查网络后重试。'
  }
  // API Key 错误
  if (raw.includes('API_KEY_INVALID') || raw.includes('401')) {
    return 'Gemini API Key 无效,请检查 .env.local 配置。'
  }
  // Supabase 权限
  if (
    raw.includes('row-level security') ||
    raw.includes('JWT') ||
    raw.includes('permission denied')
  ) {
    return '数据库权限不足。检查 Supabase RLS 策略。'
  }
  // 其他:截断展示
  return raw.length > 200 ? raw.slice(0, 200) + '...' : raw
}
