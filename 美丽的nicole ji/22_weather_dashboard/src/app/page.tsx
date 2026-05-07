'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

// ── 类型定义 ──────────────────────────────────────────────
interface DayForecast {
  date:        string;
  temp:        number;
  tempMin:     number;
  tempMax:     number;
  humidity:    number;
  description: string;
  icon:        string;
  main:        string;
}

interface CityWeather {
  city:      string;
  country:   string;
  forecasts: DayForecast[];
}

interface WeatherData {
  cities: CityWeather[];
}

// ── 各城市的颜色主题 ──────────────────────────────────────
const CITY_COLORS: Record<string, { top: string; bottom: string; accent: string }> = {
  '东京': { top: '#1e3a5f', bottom: '#1e2a5e', accent: '#93c5fd' },
  '上海': { top: '#1a3a3a', bottom: '#1a3a2a', accent: '#6ee7b7' },
  '烟台': { top: '#2d1b69', bottom: '#3b1d5e', accent: '#c4b5fd' },
};

// ── 样式常量 ──────────────────────────────────────────────
const C = {
  bg:     '#0a0f1e',
  text:   '#e2e8f0',
  muted:  '#94a3b8',
  border: 'rgba(255,255,255,0.1)',
  red:    '#f87171',
};

// ── 日期格式化 ────────────────────────────────────────────
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  if (dateStr === todayStr) return '今天';
  if (dateStr === tomorrowStr) return '明天';
  return `${date.getMonth() + 1}/${date.getDate()}(周${WEEKDAYS[date.getDay()]})`;
}

export default function Home() {
  const [data, setData]       = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // ── 获取天气数据 ──────────────────────────────────────────
  useEffect(() => {
    fetch('/api/weather')
      .then(res => res.json())
      .then(json => {
        if (json.error) setError(json.error);
        else setData(json);
        setLoading(false);
      })
      .catch(() => {
        setError('网络错误，请检查网络连接。');
        setLoading(false);
      });
  }, []);

  // ── 页面 ──────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 16px', fontFamily: 'sans-serif' }}>

      {/* 标题 */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>
          天气预报仪表盘
        </h1>
        <p style={{ color: C.muted, marginTop: 8, fontSize: 14 }}>
          东京・上海・烟台　— 3天预报
        </p>
      </div>

      {/* 加载中 */}
      {loading && (
        <div style={{ textAlign: 'center', marginTop: 60, color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p>正在获取三城市天气...</p>
        </div>
      )}

      {/* 错误 */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 12, padding: '16px 24px', maxWidth: 480, textAlign: 'center' }}>
          <p style={{ color: C.red, fontWeight: 600, margin: 0 }}>⚠ 错误</p>
          <p style={{ color: '#fca5a5', marginTop: 6, fontSize: 14 }}>{error}</p>
        </div>
      )}

      {/* 三城市卡片 */}
      {!loading && !error && data && (
        <div style={{ width: '100%', maxWidth: 960,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

          {data.cities.map(city => {
            const colors = CITY_COLORS[city.city] ?? { top: '#1e293b', bottom: '#0f172a', accent: '#94a3b8' };

            return (
              <div key={city.city} style={{
                background: `linear-gradient(160deg, ${colors.top}, ${colors.bottom})`,
                borderRadius: 20, overflow: 'hidden',
                border: `1px solid ${C.border}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}>

                {/* 城市名 */}
                <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{city.city}</h2>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{city.country}</span>
                  </div>
                </div>

                {/* 3天预报 */}
                <div>
                  {city.forecasts.map((day, i) => (
                    <div key={day.date} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 24px',
                      background: i === 0 ? 'rgba(255,255,255,0.06)' : 'transparent',
                      borderBottom: i < city.forecasts.length - 1 ? `1px solid ${C.border}` : 'none',
                    }}>

                      {/* 日期 */}
                      <div style={{ width: 72, fontSize: 13, fontWeight: 600,
                        color: 'rgba(255,255,255,0.75)', flexShrink: 0 }}>
                        {formatDate(day.date)}
                      </div>

                      {/* 天气图标 */}
                      <div style={{ width: 44, flexShrink: 0 }}>
                        <Image
                          src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                          alt={day.description}
                          width={44}
                          height={44}
                        />
                      </div>

                      {/* 天气描述 + 湿度 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.6)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {day.description}
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: 11, color: colors.accent }}>
                          湿度 {day.humidity}%
                        </p>
                      </div>

                      {/* 气温 */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                          {day.tempMax}°
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                          {day.tempMin}°
                        </p>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ marginTop: 40, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
        Powered by OpenWeatherMap
      </p>
    </main>
  );
}
