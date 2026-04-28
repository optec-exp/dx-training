import type { Urgency } from './types'

export function calcUrgency(
  deadlineDay: number,
  checked: boolean,
  todayDate: Date
): Urgency {
  if (checked) return 'done'
  const today = todayDate.getDate()
  const diff = deadlineDay - today
  if (diff < 0)  return 'overdue'
  if (diff === 0) return 'today'
  if (diff <= 3)  return 'soon'
  return 'normal'
}

export const URGENCY_ORDER: Record<Urgency, number> = {
  overdue: 0,
  today:   1,
  soon:    2,
  normal:  3,
  done:    4,
}
