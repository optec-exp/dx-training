import { NextResponse } from 'next/server'

const BASE = 'https://api.open-meteo.com/v1/forecast'
const CURRENT = 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation,is_day'
const HOURLY = 'temperature_2m,weather_code,precipitation_probability'
const DAILY = 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,precipitation_sum'

const CITIES = [
  { id: 'tokyo',    lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo'    },
  { id: 'shanghai', lat: 31.2304, lon: 121.4737, tz: 'Asia/Shanghai' },
  { id: 'yantai',   lat: 37.5333, lon: 121.3833, tz: 'Asia/Shanghai' },
]

interface OpenMeteoResp {
  current: {
    time: string
    temperature_2m: number
    relative_humidity_2m: number
    apparent_temperature: number
    weather_code: number
    wind_speed_10m: number
    wind_direction_10m: number
    precipitation: number
    is_day: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    weather_code: number[]
    precipitation_probability: number[]
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
    precipitation_probability_max: number[]
    precipitation_sum: number[]
  }
}

async function fetchCity(city: typeof CITIES[0]) {
  const url = `${BASE}?latitude=${city.lat}&longitude=${city.lon}&timezone=${city.tz}` +
    `&current=${CURRENT}&hourly=${HOURLY}&daily=${DAILY}&wind_speed_unit=kmh&forecast_days=7`

  const res = await fetch(url, { next: { revalidate: 1800 } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const d = await res.json() as OpenMeteoResp

  // Find current hour in the hourly array, take next 8 hours
  const nowTime = d.current.time
  const startIdx = Math.max(0, d.hourly.time.findIndex(t => t >= nowTime))
  const hourly = Array.from({ length: 8 }, (_, i) => {
    const idx = startIdx + i
    const time = d.hourly.time[idx] ?? ''
    const hour = parseInt(time.split('T')[1] ?? '12')
    return {
      time: time.split('T')[1] ?? '',
      temp: Math.round(d.hourly.temperature_2m[idx] ?? 0),
      code: d.hourly.weather_code[idx] ?? 0,
      precipProb: d.hourly.precipitation_probability[idx] ?? 0,
      isDay: hour >= 6 && hour < 19,
    }
  }).filter(h => h.time)

  return {
    id: city.id,
    tz: city.tz,
    current: {
      time: d.current.time,
      temp: Math.round(d.current.temperature_2m),
      feelsLike: Math.round(d.current.apparent_temperature),
      humidity: d.current.relative_humidity_2m,
      code: d.current.weather_code,
      windSpeed: Math.round(d.current.wind_speed_10m),
      windDir: d.current.wind_direction_10m,
      precipitation: d.current.precipitation,
      isDay: d.current.is_day === 1,
    },
    hourly,
    daily: d.daily.time.map((date, i) => ({
      date,
      tempMax: Math.round(d.daily.temperature_2m_max[i] ?? 0),
      tempMin: Math.round(d.daily.temperature_2m_min[i] ?? 0),
      code: d.daily.weather_code[i] ?? 0,
      precipProb: d.daily.precipitation_probability_max[i] ?? 0,
      precipSum: Math.round((d.daily.precipitation_sum[i] ?? 0) * 10) / 10,
    })),
    error: null as string | null,
  }
}

export async function GET() {
  // 3 parallel API calls — one per city
  const results = await Promise.allSettled(CITIES.map(fetchCity))

  const cities = results.map((result, i) => {
    if (result.status === 'fulfilled') return result.value
    return {
      id: CITIES[i].id,
      tz: CITIES[i].tz,
      current: null,
      hourly: [],
      daily: [],
      error: result.reason instanceof Error ? result.reason.message : 'Failed to fetch',
    }
  })

  return NextResponse.json({ cities, fetchedAt: new Date().toISOString() })
}
