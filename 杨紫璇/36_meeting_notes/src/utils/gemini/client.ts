import { GoogleGenAI } from '@google/genai'

// 仅服务器端使用（API Key 是私钥）
export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
})

// 模型选择（2026 年 5 月此账号免费层实际可用情况）：
//   - gemini-2.5-pro:   limit=0,必须付费
//   - gemini-2.0-flash: limit=0,此账号不可用
//   - gemini-2.5-flash: ✅ 唯一免费可用,但 Chinese 长文本理解一般
// 学习目的够用,生产应用需考虑付费切到 pro
export const MODEL = 'gemini-2.5-flash'
