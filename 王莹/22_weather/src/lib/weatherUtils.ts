export function getWeatherEmoji(weatherMain: string): string {
  const map: Record<string, string> = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Fog: '🌫️',
    Haze: '🌫️',
    Dust: '🌪️',
    Sand: '🌪️',
  }
  return map[weatherMain] ?? '🌡️'
}

export function getGradient(weatherMain: string): string {
  const map: Record<string, string> = {
    Clear: 'from-sky-400 to-blue-500',
    Clouds: 'from-slate-400 to-slate-500',
    Rain: 'from-slate-500 to-blue-700',
    Drizzle: 'from-blue-400 to-slate-500',
    Thunderstorm: 'from-slate-700 to-slate-900',
    Snow: 'from-sky-200 to-blue-300',
    Mist: 'from-gray-300 to-slate-400',
    Fog: 'from-gray-300 to-slate-400',
    Haze: 'from-yellow-200 to-orange-300',
  }
  return map[weatherMain] ?? 'from-sky-400 to-blue-500'
}

export function formatDate(dateStr: string, lang: 'zh' | 'ja' = 'zh'): string {
  const date = new Date(dateStr)
  const daysZh = ['日', '一', '二', '三', '四', '五', '六']
  const daysJa = ['日', '月', '火', '水', '木', '金', '土']
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dow = lang === 'ja' ? daysJa[date.getDay()] : daysZh[date.getDay()]
  return `${month}/${day}（${dow}）`
}

export function formatUpdatedAt(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
