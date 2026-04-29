'use client';

import { useState, useEffect } from 'react';

interface City {
  nameCN: string;
  nameEN: string;
  timezone: string;
  offsetFromShanghai: number; // hours
}

const CITIES: City[] = [
  { nameCN: '上海', nameEN: 'Shanghai', timezone: 'Asia/Shanghai', offsetFromShanghai: 0 },
  { nameCN: '东京', nameEN: 'Tokyo', timezone: 'Asia/Tokyo', offsetFromShanghai: 1 },
  { nameCN: '香港', nameEN: 'Hong Kong', timezone: 'Asia/Hong_Kong', offsetFromShanghai: 0 },
  { nameCN: '新加坡', nameEN: 'Singapore', timezone: 'Asia/Singapore', offsetFromShanghai: 0 },
  { nameCN: '迪拜', nameEN: 'Dubai', timezone: 'Asia/Dubai', offsetFromShanghai: -4 },
  { nameCN: '法兰克福', nameEN: 'Frankfurt', timezone: 'Europe/Berlin', offsetFromShanghai: -6 },
  { nameCN: '伦敦', nameEN: 'London', timezone: 'Europe/London', offsetFromShanghai: -7 },
  { nameCN: '纽约', nameEN: 'New York', timezone: 'America/New_York', offsetFromShanghai: -12 },
];

function getTimeInZone(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
}

function formatTime(parts: Intl.DateTimeFormatPart[]): string {
  const h = parts.find(p => p.type === 'hour')?.value ?? '00';
  const m = parts.find(p => p.type === 'minute')?.value ?? '00';
  const s = parts.find(p => p.type === 'second')?.value ?? '00';
  return `${h}:${m}:${s}`;
}

function formatDate(parts: Intl.DateTimeFormatPart[]): string {
  const y = parts.find(p => p.type === 'year')?.value ?? '';
  const mo = parts.find(p => p.type === 'month')?.value ?? '';
  const d = parts.find(p => p.type === 'day')?.value ?? '';
  return `${y}-${mo}-${d}`;
}

function getHour(parts: Intl.DateTimeFormatPart[]): number {
  return parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
}

function isWorkingHour(hour: number): boolean {
  return hour >= 9 && hour < 18;
}

function getOffsetLabel(offset: number): string {
  if (offset === 0) return '与上海同区';
  return offset > 0 ? `+${offset}h` : `${offset}h`;
}

// Compute real offset between two timezones using current date
function getRealOffset(date: Date, tz1: string, tz2: string): number {
  const fmt = (tz: string) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(date);
    const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
    const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
    return h * 60 + m;
  };
  // Use UTC offsets via getTimezoneOffset approach
  const toMinutes = (tz: string) => {
    const d = new Date(date.toLocaleString('en-US', { timeZone: tz }));
    const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    return (d.getTime() - utc.getTime()) / 60000;
  };
  const diff = toMinutes(tz1) - toMinutes(tz2);
  return diff / 60;
}

export default function HomePage() {
  const [now, setNow] = useState<Date>(new Date());
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-lg">加载中...</div>
      </div>
    );
  }

  const localParts = getTimeInZone(now, 'Asia/Shanghai');
  const localTime = formatTime(localParts);
  const localDate = formatDate(localParts);

  return (
    <div className="min-h-screen" style={{ background: '#f5f6f8' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a56db 0%, #0e3fa8 100%)' }} className="text-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="text-2xl">🌐</div>
            <h1 className="text-2xl font-bold tracking-wide">OPTEC 时区转换工具</h1>
          </div>
          <p className="text-blue-200 text-sm mb-6 ml-10">国际业务实时时区参考</p>
          <div className="text-center">
            <div className="text-blue-200 text-sm mb-1">本机时间（上海）</div>
            <div
              className="font-mono font-bold tracking-widest"
              style={{ fontSize: '3.5rem', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
            >
              {localTime}
            </div>
            <div className="text-blue-200 mt-1 text-base">{localDate} 星期{['日','一','二','三','四','五','六'][now.getDay()]}</div>
          </div>
        </div>
      </div>

      {/* City Cards */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h2 className="text-gray-600 text-sm font-semibold uppercase tracking-wider mb-4">全球城市时间</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CITIES.map((city) => {
            const parts = getTimeInZone(now, city.timezone);
            const timeStr = formatTime(parts);
            const dateStr = formatDate(parts);
            const hour = getHour(parts);
            const working = isWorkingHour(hour);
            const realOffset = getRealOffset(now, city.timezone, 'Asia/Shanghai');
            const offsetLabel = getOffsetLabel(realOffset);

            return (
              <div
                key={city.timezone}
                onClick={() => setSelectedCity(selectedCity?.timezone === city.timezone ? null : city)}
                className="rounded-xl p-4 cursor-pointer transition-all duration-200"
                style={{
                  background: working ? '#ffffff' : '#f0f0f2',
                  boxShadow: selectedCity?.timezone === city.timezone
                    ? '0 0 0 2px #1a56db, 0 4px 16px rgba(26,86,219,0.15)'
                    : '0 2px 8px rgba(0,0,0,0.08)',
                  transform: selectedCity?.timezone === city.timezone ? 'translateY(-2px)' : 'none',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-gray-800 text-base">{city.nameCN}</div>
                    <div className="text-gray-400 text-xs">{city.nameEN}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: working ? '#22c55e' : '#d1d5db' }}
                      />
                      <span className="text-xs" style={{ color: working ? '#16a34a' : '#9ca3af' }}>
                        {working ? '工作中' : '休息中'}
                      </span>
                    </div>
                    {city.nameCN !== '上海' && (
                      <span
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background: realOffset === 0 ? '#f0fdf4' : realOffset > 0 ? '#eff6ff' : '#fff7ed',
                          color: realOffset === 0 ? '#15803d' : realOffset > 0 ? '#1d4ed8' : '#c2410c',
                        }}
                      >
                        {offsetLabel}
                      </span>
                    )}
                    {city.nameCN === '上海' && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#f0fdf4', color: '#15803d' }}>
                        基准
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="font-mono font-bold text-gray-900 mt-1"
                  style={{ fontSize: '1.6rem', letterSpacing: '0.04em' }}
                >
                  {timeStr}
                </div>
                <div className="text-gray-400 text-xs mt-1">{dateStr}</div>
              </div>
            );
          })}
        </div>

        {/* Diff Table */}
        <div className="mt-8">
          <h2 className="text-gray-600 text-sm font-semibold uppercase tracking-wider mb-2">
            时差对照表
            {selectedCity
              ? <span className="text-blue-600 normal-case ml-2">— 以 {selectedCity.nameCN} 为基准</span>
              : <span className="text-gray-400 normal-case font-normal ml-2">（点击城市卡片选择基准城市）</span>}
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: '#fff' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#1a56db', color: '#fff' }}>
                  <th className="text-left px-4 py-3 font-semibold">城市</th>
                  <th className="text-left px-4 py-3 font-semibold">当地时间</th>
                  <th className="text-left px-4 py-3 font-semibold">
                    {selectedCity ? `与${selectedCity.nameCN}时差` : '与上海时差'}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold">工作状态</th>
                </tr>
              </thead>
              <tbody>
                {CITIES.map((city, i) => {
                  const parts = getTimeInZone(now, city.timezone);
                  const timeStr = formatTime(parts);
                  const hour = getHour(parts);
                  const working = isWorkingHour(hour);
                  const base = selectedCity ?? CITIES[0];
                  const realOffset = getRealOffset(now, city.timezone, base.timezone);
                  const isBase = city.timezone === base.timezone;

                  return (
                    <tr
                      key={city.timezone}
                      onClick={() => setSelectedCity(selectedCity?.timezone === city.timezone ? null : city)}
                      className="cursor-pointer transition-colors"
                      style={{
                        background: i % 2 === 0 ? '#f9fafb' : '#ffffff',
                        ...(selectedCity?.timezone === city.timezone ? { background: '#eff6ff' } : {}),
                      }}
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800">{city.nameCN}</span>
                        <span className="text-gray-400 ml-1 text-xs">{city.nameEN}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">{timeStr}</td>
                      <td className="px-4 py-3">
                        {isBase ? (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: '#dcfce7', color: '#15803d' }}>基准城市</span>
                        ) : (
                          <span
                            className="font-semibold"
                            style={{ color: realOffset === 0 ? '#15803d' : realOffset > 0 ? '#1d4ed8' : '#c2410c' }}
                          >
                            {realOffset === 0 ? '同一时区' : realOffset > 0 ? `早 ${realOffset} 小时` : `晚 ${Math.abs(realOffset)} 小时`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: working ? '#22c55e' : '#d1d5db' }} />
                          <span style={{ color: working ? '#16a34a' : '#9ca3af' }}>
                            {working ? '工作时间' : '非工作时间'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-gray-400 text-xs mt-2">工作时间定义：09:00–18:00（当地时间）</p>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-xs mt-8 pb-4">
          OPTEC DX室 · 时区转换工具 · 数据每秒实时更新
        </div>
      </div>
    </div>
  );
}
