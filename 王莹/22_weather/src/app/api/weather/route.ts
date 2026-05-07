import { NextResponse } from 'next/server'

const CITIES = [
  { name: '东京', nameEn: 'Tokyo', id: 1850144 },
  { name: '上海', nameEn: 'Shanghai', id: 1796236 },
  { name: '烟台', nameEn: 'Yantai', id: 1787093 },
]

const API_KEY = process.env.OPENWEATHER_API_KEY

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const results = await Promise.all(
      CITIES.map(async (city) => {
        const [currentRes, forecastRes] = await Promise.all([
          fetch(
            `https://api.openweathermap.org/data/2.5/weather?id=${city.id}&appid=${API_KEY}&units=metric&lang=zh_cn`,
            { next: { revalidate: 600 } }
          ),
          fetch(
            `https://api.openweathermap.org/data/2.5/forecast?id=${city.id}&appid=${API_KEY}&units=metric&lang=zh_cn&cnt=24`,
            { next: { revalidate: 600 } }
          ),
        ])

        if (!currentRes.ok || !forecastRes.ok) {
          throw new Error(`Failed to fetch data for ${city.nameEn}`)
        }

        const current = await currentRes.json()
        const forecast = await forecastRes.json()

        // 按本地日期分组，取每天真实最高/最低温
        interface ForecastItem {
          dt_txt: string
          dt: number
          main: { temp: number; temp_max: number; temp_min: number }
          weather: { description: string; icon: string; main: string }[]
        }
        const tzOffset = city.id === 1850144 ? 9 * 3600 : 8 * 3600 // 东京UTC+9，其他UTC+8
        const grouped: Record<string, ForecastItem[]> = {}
        for (const item of forecast.list as ForecastItem[]) {
          const localDate = new Date((item.dt + tzOffset) * 1000).toISOString().split('T')[0]
          if (!grouped[localDate]) grouped[localDate] = []
          grouped[localDate].push(item)
        }
        const today = new Date((Math.floor(Date.now() / 1000) + tzOffset) * 1000).toISOString().split('T')[0]
        const dailyForecasts = Object.entries(grouped)
          .filter(([date]) => date >= today)
          .slice(0, 3)
          .map(([date, items]) => {
            const temps = items.map(i => i.main.temp)
            const noonItem = items.find(i => i.dt_txt.includes('12:00:00')) ?? items[Math.floor(items.length / 2)]
            return {
              date,
              tempMax: Math.round(Math.max(...temps)),
              tempMin: Math.round(Math.min(...temps)),
              description: noonItem.weather[0].description,
              icon: noonItem.weather[0].icon,
              weatherMain: noonItem.weather[0].main,
            }
          })

        return {
          city: city.name,
          cityEn: city.nameEn,
          current: {
            temp: Math.round(current.main.temp),
            feelsLike: Math.round(current.main.feels_like),
            humidity: current.main.humidity,
            windSpeed: Math.round(current.wind.speed * 3.6), // m/s → km/h
            description: current.weather[0].description,
            icon: current.weather[0].icon,
            weatherMain: current.weather[0].main,
          },
          forecast: dailyForecasts,
        }
      })
    )

    return NextResponse.json({ cities: results, updatedAt: new Date().toISOString() })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
