'use client'

import { useEffect, useState, useCallback } from 'react'
import WeatherCard from '@/components/WeatherCard'
import { formatUpdatedAt } from '@/lib/weatherUtils'

interface CityWeather {
  city: string
  cityEn: string
  current: {
    temp: number
    feelsLike: number
    humidity: number
    windSpeed: number
    description: string
    icon: string
    weatherMain: string
  }
  forecast: {
    date: string
    tempMax: number
    tempMin: number
    description: string
    icon: string
    weatherMain: string
  }[]
}

interface WeatherResponse {
  cities: CityWeather[]
  updatedAt: string
}

export default function Home() {
  const [data, setData] = useState<WeatherResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWeather = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/weather')
      if (!res.ok) throw new Error('天气数据获取失败，请稍后重试')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWeather()
  }, [fetchWeather])

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-white">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              🌏 天气预报
            </h1>
            <p className="text-slate-500 mt-1 text-sm">东京 · 上海 · 烟台</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {data && (
              <p className="text-xs text-slate-400">
                更新于 {formatUpdatedAt(data.updatedAt)}
              </p>
            )}
            <button
              onClick={fetchWeather}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow text-sm text-slate-600 hover:shadow-md hover:text-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={loading ? 'animate-spin inline-block' : 'inline-block'}>↻</span>
              刷新
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-sky-200 border-t-sky-500 animate-spin" />
            <p className="text-slate-500 text-sm">正在获取三城市天气数据…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <span className="text-5xl">⚠️</span>
            <p className="text-slate-600 text-base">{error}</p>
            <button
              onClick={fetchWeather}
              className="mt-2 px-6 py-2 rounded-full bg-sky-500 text-white text-sm hover:bg-sky-600 transition-colors"
            >
              重新加载
            </button>
          </div>
        )}

        {/* Weather Cards */}
        {!loading && !error && data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.cities.map((city) => (
              <WeatherCard key={city.city} data={city} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-8 text-xs text-slate-400">
        数据来源：OpenWeatherMap · 每10分钟自动更新
      </div>
    </main>
  )
}
