export function confidenceColor(c) {
  if (c > 0.8) return { bar: 'bg-green-500', text: 'text-green-600' }
  if (c >= 0.5) return { bar: 'bg-yellow-500', text: 'text-yellow-600' }
  return { bar: 'bg-red-500', text: 'text-red-600' }
}

export function formatTime(iso) {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
