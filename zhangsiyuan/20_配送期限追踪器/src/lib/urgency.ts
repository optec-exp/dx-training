import type { EtaUrgency, EtdStatus } from './types'

/** 日付文字列 "YYYY-MM-DD" と今日のDateを比較して差分日数を返す（正=未来、負=過去） */
export function diffDays(dateStr: string, today: Date): number {
  const target = new Date(dateStr + 'T00:00:00')
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target.getTime() - t.getTime()) / 86400000)
}

export function calcEtaUrgency(eta: string, arrived: boolean, today: Date): EtaUrgency {
  if (arrived) return 'arrived'
  const d = diffDays(eta, today)
  if (d < 0)  return 'overdue'
  if (d === 0) return 'today'
  if (d <= 3)  return 'soon'
  return 'normal'
}

export function calcEtdStatus(etd: string, departed: boolean, today: Date): EtdStatus {
  if (departed) return 'departed'
  const d = diffDays(etd, today)
  if (d < 0)  return 'delayed'
  if (d === 0) return 'departing'
  return 'upcoming'
}

export const ETA_URGENCY_ORDER: Record<EtaUrgency, number> = {
  overdue: 0,
  today:   1,
  soon:    2,
  normal:  3,
  arrived: 4,
}
