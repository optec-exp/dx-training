export type Lang = 'zh' | 'en' | 'ja'

export type Priority = 'urgent' | 'normal' | 'low'

/** ETAに基づく到着urgency */
export type EtaUrgency = 'overdue' | 'today' | 'soon' | 'normal' | 'arrived'

/** ETDに基づく出発urgency */
export type EtdStatus = 'delayed' | 'departing' | 'upcoming' | 'departed'

export interface Shipment {
  id: string
  awb: string
  origin: string
  destination: string
  cargo: { zh: string; en: string; ja: string }
  etd: string   // YYYY-MM-DD
  eta: string   // YYYY-MM-DD
  weightKg: number
  priority: Priority
}

export interface ShipmentState {
  departed: boolean
  arrived: boolean
  departedAt: string | null
  arrivedAt: string | null
}
