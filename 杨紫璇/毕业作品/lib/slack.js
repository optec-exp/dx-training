// 客户端调用,经服务端 /api/slack-notify 转发(Webhook URL 不暴露给浏览器)
// 静默失败 — 通知失败不应阻塞业务流程
export async function notifySlack(event, payload = {}) {
  try {
    const res = await fetch('/api/slack-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.warn('[slack] notify failed:', data.error || res.status)
      return false
    }
    return true
  } catch (err) {
    console.warn('[slack] notify error:', err.message)
    return false
  }
}
