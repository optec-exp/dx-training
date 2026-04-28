export type TransportType = 'NFO' | 'OBC' | 'ECO'

// Air freight rate USD/kg by zone × transport type
const RATE: Record<number, Record<TransportType, number>> = {
  1: { NFO: 8.0,  OBC: 5.5,  ECO: 2.8  },  // < 1,500 km
  2: { NFO: 10.5, OBC: 7.5,  ECO: 3.8  },  // 1,500 – 4,000 km
  3: { NFO: 13.0, OBC: 9.5,  ECO: 5.0  },  // 4,000 – 7,000 km
  4: { NFO: 16.0, OBC: 12.0, ECO: 6.5  },  // 7,000 – 10,000 km
  5: { NFO: 19.5, OBC: 14.5, ECO: 8.0  },  // 10,000 – 13,000 km
  6: { NFO: 23.0, OBC: 17.0, ECO: 9.5  },  // > 13,000 km
}

const FUEL_SC    = 0.60  // USD/kg
const SECURITY   = 0.35  // USD/kg
const HANDLING   = 55    // USD flat
const AWB        = 35    // USD flat
export const MIN_WEIGHT = 45  // kg minimum chargeable weight

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function getZone(km: number): number {
  if (km < 1500)  return 1
  if (km < 4000)  return 2
  if (km < 7000)  return 3
  if (km < 10000) return 4
  if (km < 13000) return 5
  return 6
}

export type CalcResult = {
  distanceKm: number
  zone: number
  actualWeight: number
  chargeableWeight: number
  airFreight: number
  fuelSC: number
  security: number
  handling: number
  awb: number
  cost: number
  profit: number
  total: number
  marginRate: number
}

export function calculate(
  originLat: number, originLng: number,
  destLat: number,   destLng: number,
  weightKg: number,
  transport: TransportType,
  marginRate: number,
): CalcResult {
  const distanceKm      = haversine(originLat, originLng, destLat, destLng)
  const zone            = getZone(distanceKm)
  const actualWeight    = weightKg
  const chargeableWeight = Math.max(weightKg, MIN_WEIGHT)

  const airFreight = chargeableWeight * RATE[zone][transport]
  const fuelSC     = chargeableWeight * FUEL_SC
  const security   = chargeableWeight * SECURITY
  const handling   = HANDLING
  const awb        = AWB

  const cost    = airFreight + fuelSC + security + handling + awb
  const profit  = cost * (marginRate / 100)
  const total   = cost + profit

  return { distanceKm, zone, actualWeight, chargeableWeight, airFreight, fuelSC, security, handling, awb, cost, profit, total, marginRate }
}
