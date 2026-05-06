'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface DayForecast {
  date: string;
  temp: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  description: string;
  icon: string;
  main: string;
}

interface CityWeather {
  city: string;
  country: string;
  forecasts: DayForecast[];
}

interface WeatherData {
  cities: CityWeather[];
}

const CITY_STYLES: Record<string, { gradient: string; accent: string }> = {
  '東京': { gradient: 'from-blue-900 to-indigo-800', accent: 'text-blue-300' },
  '上海': { gradient: 'from-teal-900 to-emerald-800', accent: 'text-emerald-300' },
  '烟台': { gradient: 'from-violet-900 to-purple-800', accent: 'text-violet-300' },
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  if (dateStr === todayStr) return '今日';
  if (dateStr === tomorrowStr) return '明日';
  return `${date.getMonth() + 1}/${date.getDate()}(${WEEKDAYS[date.getDay()]})`;
}

export default function Home() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/weather')
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('ネットワークエラーが発生しました。接続を確認してください。');
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          天気予報ダッシュボード
        </h1>
        <p className="text-slate-400 text-sm">東京 · 上海 · 烟台　— 3日間予報</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-4 mt-20">
          <div className="w-14 h-14 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">3都市の天気を取得中...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-950/70 border border-red-500/60 rounded-2xl px-8 py-6 max-w-lg text-center shadow-xl">
          <p className="text-red-400 font-bold text-lg mb-2">⚠ データ取得エラー</p>
          <p className="text-red-200 text-sm leading-relaxed">{error}</p>
        </div>
      )}

      {/* City Cards */}
      {!loading && !error && data && (
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.cities.map((city) => {
            const style = CITY_STYLES[city.city] ?? {
              gradient: 'from-slate-800 to-slate-700',
              accent: 'text-slate-300',
            };
            return (
              <div
                key={city.city}
                className={`bg-gradient-to-b ${style.gradient} rounded-2xl shadow-2xl overflow-hidden`}
              >
                {/* City Header */}
                <div className="px-6 pt-6 pb-4 border-b border-white/10">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold">{city.city}</h2>
                    <span className="text-white/40 text-sm">{city.country}</span>
                  </div>
                </div>

                {/* Forecast Rows */}
                <div className="divide-y divide-white/10">
                  {city.forecasts.map((day, i) => (
                    <div
                      key={day.date}
                      className={`flex items-center gap-3 px-6 py-4 ${i === 0 ? 'bg-white/5' : ''}`}
                    >
                      {/* Date */}
                      <div className="w-14 text-sm font-semibold text-white/75 shrink-0">
                        {formatDate(day.date)}
                      </div>

                      {/* Icon */}
                      <div className="w-12 shrink-0">
                        <Image
                          src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                          alt={day.description}
                          width={48}
                          height={48}
                          className="drop-shadow"
                        />
                      </div>

                      {/* Condition */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/60 truncate capitalize">
                          {day.description}
                        </p>
                        <p className={`text-xs mt-0.5 ${style.accent}`}>
                          湿度 {day.humidity}%
                        </p>
                      </div>

                      {/* Temperature */}
                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold leading-none">{day.tempMax}°</p>
                        <p className="text-sm text-white/40 mt-1">{day.tempMin}°</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-10 text-xs text-slate-700">Powered by OpenWeatherMap</p>
    </main>
  );
}
