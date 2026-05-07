'use client'

import Image from 'next/image'
import { getWeatherEmoji, getGradient, formatDate } from '@/lib/weatherUtils'

interface ForecastDay {
  date: string
  tempMax: number
  tempMin: number
  description: string
  icon: string
  weatherMain: string
}

interface WeatherData {
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
  forecast: ForecastDay[]
}

export default function WeatherCard({ data }: { data: WeatherData }) {
  const { city, cityEn, current, forecast } = data
  const gradient = getGradient(current.weatherMain)

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* 顶部：当前天气 */}
      <div className={`bg-gradient-to-br ${gradient} p-6 text-white`}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-wide">{city}</h2>
            <p className="text-white/70 text-sm">{cityEn}</p>
          </div>
          <span className="text-5xl">{getWeatherEmoji(current.weatherMain)}</span>
        </div>

        <div className="mt-4 flex items-end gap-3">
          <span className="text-7xl font-thin leading-none">{current.temp}°</span>
          <div className="mb-2">
            <p className="text-white/80 capitalize">{current.description}</p>
            <p className="text-white/60 text-sm">体感 {current.feelsLike}°C</p>
          </div>
        </div>

        <div className="mt-4 flex gap-6 text-sm text-white/80">
          <span>💧 湿度 {current.humidity}%</span>
          <span>💨 风速 {current.windSpeed} km/h</span>
        </div>

        {/* 天气图标（OpenWeatherMap官方） */}
        <div className="absolute opacity-0 w-0 h-0">
          <Image
            src={`https://openweathermap.org/img/wn/${current.icon}@2x.png`}
            alt={current.description}
            width={80}
            height={80}
          />
        </div>
      </div>

      {/* 底部：3天预报 */}
      <div className="bg-white/90 backdrop-blur-sm p-4 flex gap-2">
        {forecast.map((day) => (
          <div
            key={day.date}
            className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <p className="text-xs text-gray-500">{formatDate(day.date, cityEn === 'Tokyo' ? 'ja' : 'zh')}</p>
            <span className="text-xl">{getWeatherEmoji(day.weatherMain)}</span>
            <p className="text-xs text-gray-400 capitalize text-center leading-tight">{day.description}</p>
            <div className="flex gap-1 text-xs font-medium mt-1">
              <span className="text-orange-500">{day.tempMax}°</span>
              <span className="text-gray-300">/</span>
              <span className="text-blue-400">{day.tempMin}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
