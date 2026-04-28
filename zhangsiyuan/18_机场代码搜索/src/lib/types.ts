export type Lang = 'zh' | 'en' | 'ja'

export interface Airport {
  iata: string
  icao: string
  name: string
  city: string
  country: string
  lat: number
  lon: number
  elev: number
  type: 'large' | 'medium'
}
