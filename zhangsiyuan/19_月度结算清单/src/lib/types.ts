export type Lang = 'zh' | 'en' | 'ja'

export type Category = 'ar' | 'ap' | 'reconcile' | 'report' | 'approval'

export type Urgency = 'overdue' | 'today' | 'soon' | 'normal' | 'done'

export interface ChecklistItem {
  id: string
  category: Category
  deadlineDay: number        // day-of-month (1–31)
  priority: 'high' | 'medium' | 'low'
  label: { zh: string; en: string; ja: string }
  note:  { zh: string; en: string; ja: string }
}

export interface ItemState {
  checked: boolean
  checkedAt: string | null   // ISO date string
}
