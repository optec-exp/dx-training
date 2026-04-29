'use client';

import { useState, useEffect, useCallback } from 'react';

// 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
interface Flight {
  id: string;
  flightNo: string;
  route: string;
  days: number[]; // days of week this flight operates
  cutoffTime: string; // "HH:MM"
  custom?: boolean;
}

const DEFAULT_FLIGHTS: Flight[] = [
  { id: '1', flightNo: 'CA837', route: '上海 → 东京', days: [1, 3, 5], cutoffTime: '09:00' },
  { id: '2', flightNo: 'NH930', route: '上海 → 东京', days: [2, 4, 6], cutoffTime: '10:00' },
  { id: '3', flightNo: 'CX345', route: '上海 → 香港', days: [1, 2, 3, 4, 5], cutoffTime: '14:00' },
  { id: '4', flightNo: 'LH728', route: '上海 → 法兰克福', days: [2, 4], cutoffTime: '16:00' },
  { id: '5', flightNo: 'AA197', route: '上海 → 纽约', days: [3, 6], cutoffTime: '11:00' },
  { id: '6', flightNo: 'EK331', route: '上海 → 迪拜', days: [1, 3, 5], cutoffTime: '13:00' },
];

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const DAY_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

function getNextCutoff(flight: Flight, now: Date): Date {
  const [hh, mm] = flight.cutoffTime.split(':').map(Number);
  for (let offset = 0; offset < 7; offset++) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(hh, mm, 0, 0);
    if (flight.days.includes(candidate.getDay()) && candidate > now) {
      return candidate;
    }
  }
  // fallback: same logic wrapping
  const candidate = new Date(now);
  candidate.setDate(candidate.getDate() + 7);
  candidate.setHours(hh, mm, 0, 0);
  return candidate;
}

function msToHMS(ms: number): { h: string; m: string; s: string } {
  if (ms <= 0) return { h: '00', m: '00', s: '00' };
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  };
}

function CountdownDisplay({ ms, label }: { ms: number; label: string }) {
  const { h, m, s } = msToHMS(ms);
  const urgent = ms > 0 && ms < 6 * 3600 * 1000;
  const warning = ms > 0 && ms < 24 * 3600 * 1000 && !urgent;
  const past = ms <= 0;

  const colorClass = past
    ? 'text-slate-500'
    : urgent
    ? 'text-red-400 animate-pulse-red'
    : warning
    ? 'text-yellow-300'
    : 'text-cyan-400';

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      {past ? (
        <span className="text-sm text-slate-500 font-mono">已截止</span>
      ) : (
        <div className={`font-mono text-lg font-bold tracking-widest ${colorClass}`}>
          {h}<span className="animate-blink mx-0.5">:</span>{m}<span className="animate-blink mx-0.5">:</span>{s}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ ms }: { ms: number }) {
  if (ms <= 0) return <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-400">已截止</span>;
  if (ms < 6 * 3600 * 1000) return <span className="px-2 py-0.5 rounded-full text-xs bg-red-900/60 text-red-300 animate-pulse-red">紧急</span>;
  if (ms < 24 * 3600 * 1000) return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-900/60 text-yellow-300">临近</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-900/60 text-emerald-300">正常</span>;
}

interface AddFlightForm {
  flightNo: string;
  route: string;
  days: number[];
  cutoffTime: string;
}

export default function Page() {
  const [now, setNow] = useState<Date>(new Date());
  const [flights, setFlights] = useState<Flight[]>(DEFAULT_FLIGHTS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AddFlightForm>({ flightNo: '', route: '', days: [], cutoffTime: '09:00' });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleDay = useCallback((day: number) => {
    setForm(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day].sort(),
    }));
  }, []);

  const handleAdd = () => {
    if (!form.flightNo.trim() || !form.route.trim() || form.days.length === 0) return;
    const newFlight: Flight = {
      id: String(Date.now()),
      flightNo: form.flightNo.trim().toUpperCase(),
      route: form.route.trim(),
      days: form.days,
      cutoffTime: form.cutoffTime,
      custom: true,
    };
    setFlights(prev => [...prev, newFlight]);
    setForm({ flightNo: '', route: '', days: [], cutoffTime: '09:00' });
    setShowModal(false);
  };

  const handleRemove = (id: string) => {
    setFlights(prev => prev.filter(f => f.id !== id));
  };

  const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0f172a' }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              截货时间倒计时
            </h1>
            <p className="text-slate-400 text-sm mt-1">OPTEC 运营/财务 · 实时班次追踪</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="font-mono text-3xl font-bold text-cyan-400 tracking-widest">{timeStr}</div>
            <div className="text-slate-400 text-sm mt-1">{dateStr}</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>超过24小时</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-300 inline-block"></span>6–24小时</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>不足6小时</span>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          {flights.map(flight => {
            const cutoff = getNextCutoff(flight, now);
            const docDeadline = new Date(cutoff.getTime() + 2 * 3600 * 1000);
            const departure = new Date(cutoff.getTime() + 6 * 3600 * 1000);

            const msCutoff = cutoff.getTime() - now.getTime();
            const msDoc = docDeadline.getTime() - now.getTime();
            const msDep = departure.getTime() - now.getTime();

            const cutoffDateStr = cutoff.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short' });
            const cutoffTimeStr = cutoff.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

            return (
              <div
                key={flight.id}
                className="rounded-xl p-5 border border-slate-700/50 relative"
                style={{ background: '#1e293b' }}
              >
                {/* Remove button for custom */}
                {flight.custom && (
                  <button
                    onClick={() => handleRemove(flight.id)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-red-400 text-lg leading-none"
                    title="删除"
                  >
                    ×
                  </button>
                )}

                {/* Flight Info */}
                <div className="flex items-start justify-between mb-4 pr-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-lg">{flight.flightNo}</span>
                      <StatusBadge ms={msCutoff} />
                    </div>
                    <div className="text-slate-400 text-sm mt-0.5">{flight.route}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-500 text-xs">下次截货</div>
                    <div className="text-white text-sm font-mono">{cutoffDateStr}</div>
                    <div className="text-cyan-300 text-sm font-mono font-bold">{cutoffTimeStr}</div>
                  </div>
                </div>

                {/* Operating days */}
                <div className="flex gap-1 mb-4">
                  {[0, 1, 2, 3, 4, 5, 6].map(d => (
                    <span
                      key={d}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                        flight.days.includes(d)
                          ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/50'
                          : 'bg-slate-700/40 text-slate-600'
                      }`}
                    >
                      {DAY_SHORT[d]}
                    </span>
                  ))}
                </div>

                {/* Countdown section */}
                <div
                  className="rounded-lg p-3 grid grid-cols-3 gap-2"
                  style={{ background: '#0f172a' }}
                >
                  <CountdownDisplay ms={msCutoff} label="NFO截货" />
                  <CountdownDisplay ms={msDoc} label="文件截止" />
                  <CountdownDisplay ms={msDep} label="起飞" />
                </div>

                {/* Sub labels */}
                <div className="grid grid-cols-3 gap-2 mt-1.5 text-center">
                  <span className="text-slate-600 text-xs">{cutoff.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                  <span className="text-slate-600 text-xs">{docDeadline.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                  <span className="text-slate-600 text-xs">{departure.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-600 text-slate-300 hover:border-cyan-500 hover:text-cyan-400 transition-colors text-sm font-medium"
            style={{ background: '#1e293b' }}
          >
            <span className="text-lg leading-none">+</span>
            添加自定义班次
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 border border-slate-700" style={{ background: '#1e293b' }}>
            <h2 className="text-white text-lg font-bold mb-5">添加自定义班次</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1.5">航班号</label>
                <input
                  type="text"
                  value={form.flightNo}
                  onChange={e => setForm(p => ({ ...p, flightNo: e.target.value }))}
                  placeholder="例：MU512"
                  className="w-full rounded-lg px-3 py-2 text-white text-sm border border-slate-600 outline-none focus:border-cyan-500"
                  style={{ background: '#0f172a' }}
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1.5">航线</label>
                <input
                  type="text"
                  value={form.route}
                  onChange={e => setForm(p => ({ ...p, route: e.target.value }))}
                  placeholder="例：上海 → 首尔"
                  className="w-full rounded-lg px-3 py-2 text-white text-sm border border-slate-600 outline-none focus:border-cyan-500"
                  style={{ background: '#0f172a' }}
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1.5">运营日（可多选）</label>
                <div className="flex gap-2">
                  {DAY_NAMES.map((name, d) => (
                    <button
                      key={d}
                      onClick={() => toggleDay(d)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.days.includes(d)
                          ? 'border-cyan-500 bg-cyan-900/40 text-cyan-300'
                          : 'border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1.5">截货时间</label>
                <input
                  type="time"
                  value={form.cutoffTime}
                  onChange={e => setForm(p => ({ ...p, cutoffTime: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-white text-sm border border-slate-600 outline-none focus:border-cyan-500"
                  style={{ background: '#0f172a' }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:border-slate-500 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                disabled={!form.flightNo.trim() || !form.route.trim() || form.days.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium transition-colors"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
