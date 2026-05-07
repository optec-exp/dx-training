'use client';

import { useState, useCallback } from 'react';

// ── 类型定义 ──────────────────────────────────────────────
interface FlightDep {
  airport:   string;
  iata:      string;
  scheduled: string;
  actual:    string | null;
  delay:     number | null;
  terminal:  string | null;
  gate:      string | null;
}
interface FlightArr {
  airport:   string;
  iata:      string;
  scheduled: string;
  actual:    string | null;
  delay:     number | null;
  terminal:  string | null;
  gate:      string | null;
  baggage:   string | null;
}
interface Flight {
  flight_date:   string;
  flight_status: string;
  departure:     FlightDep;
  arrival:       FlightArr;
  airline:       { name: string; iata: string };
  flight:        { iata: string; number: string };
}

// ── 热门航线快捷键 ────────────────────────────────────────
const POPULAR = [
  { label: 'NRT → LHR', dep: 'NRT', arr: 'LHR' },
  { label: 'HND → CDG', dep: 'HND', arr: 'CDG' },
  { label: 'NRT → JFK', dep: 'NRT', arr: 'JFK' },
  { label: 'SIN → SYD', dep: 'SIN', arr: 'SYD' },
];

// ── 时间格式化 ────────────────────────────────────────────
function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  return iso.split('T')[1]?.slice(0, 5) ?? '—';
}
function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return iso.split('T')[0] ?? '—';
}

// ── 状态颜色 ─────────────────────────────────────────────
function statusClass(s: string): string {
  if (s === 'active')    return 'r-status status-active';
  if (s === 'landed')    return 'r-status status-landed';
  if (s === 'cancelled') return 'r-status status-cancelled';
  return 'r-status status-scheduled';
}
function statusLabel(s: string): string {
  const map: Record<string, string> = {
    scheduled: '待出发', active: '飞行中', landed: '已到达',
    cancelled: '已取消', diverted: '改降', incident: '异常',
  };
  return map[s] ?? s;
}

// ── 主页面 ───────────────────────────────────────────────
export default function Home() {
  const [dep, setDep]       = useState('');
  const [arr, setArr]       = useState('');

  const [flights, setFlights]   = useState<Flight[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // ── 搜索 ─────────────────────────────────────────────
  const doSearch = useCallback(async () => {
    if (!dep || !arr) return;
    setLoading(true);
    setError(null);
    setSearched(true);

    // URLSearchParams 把参数拼成 ?dep=NRT&arr=LHR
    const params = new URLSearchParams({ dep, arr });

    try {
      const res  = await fetch(`/api/flights?${params}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setFlights([]);
      } else {
        setFlights(data.flights ?? []);
      }
    } catch {
      setError('网络错误，请检查连接。');
      setFlights([]);
    } finally {
      setLoading(false);
    }
  }, [dep, arr]);

  // ── 快捷航线 ─────────────────────────────────────────
  const applyHint = (d: string, a: string) => {
    setDep(d);
    setArr(a);
  };

  // ── 出发/目的地互换 ───────────────────────────────────
  const swap = () => {
    setDep(arr);
    setArr(dep);
  };

  return (
    <div className="app">

      {/* 顶部标题栏 */}
      <header className="header">
        <span className="header-icon">✈</span>
        <span className="header-title">航班信息搜索</span>
      </header>

      <main className="main">

        {/* 搜索表单 */}
        <div className="search-card">
          <h2>搜索条件</h2>

          <div className="fields">
            {/* 出发地 */}
            <div className="field field-wide">
              <label>出发地 (IATA)</label>
              <input
                className="input"
                value={dep}
                onChange={e => setDep(e.target.value.toUpperCase())}
                placeholder="例: NRT"
                maxLength={3}
              />
            </div>

            {/* 互换按钮 */}
            <button className="swap-btn" onClick={swap} title="互换">⇄</button>

            {/* 目的地 */}
            <div className="field field-wide">
              <label>目的地 (IATA)</label>
              <input
                className="input"
                value={arr}
                onChange={e => setArr(e.target.value.toUpperCase())}
                placeholder="例: LHR"
                maxLength={3}
              />
            </div>

          </div>

          {/* 搜索按钮 */}
          <button
            className="search-btn"
            onClick={doSearch}
            disabled={!dep || !arr || loading}
          >
            {loading ? '搜索中...' : '搜索航班'}
          </button>

          {/* 热门航线快捷键 */}
          <div className="hints">
            <span>热门航线：</span>
            {POPULAR.map(r => (
              <button
                key={r.label}
                className="hint-btn"
                onClick={() => applyHint(r.dep, r.arr)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* 加载中 */}
        {loading && (
          <div className="loading">
            <div className="spinner" />
            <span>正在搜索航班...</span>
          </div>
        )}

        {/* 错误 */}
        {!loading && error && (
          <div className="error-box">⚠ {error}</div>
        )}

        {/* 没有结果 */}
        {!loading && searched && !error && flights.length === 0 && (
          <div className="no-results">
            <div className="no-results-icon">✈️</div>
            <div>未找到符合条件的航班</div>
          </div>
        )}

        {/* 搜索结果 */}
        {!loading && flights.length > 0 && (
          <div>
            <div className="results-header">
              <span className="results-count">
                共找到 {flights.length} 个航班
              </span>
            </div>

            <div className="flights-list">
              {flights.map((f, i) => (
                <div key={i} className="flight-card">

                  {/* 上方：航空公司 + 航班号 + 日期 */}
                  <div className="card-top">
                    <span className="airline-badge">{f.airline.iata}</span>
                    <span className="flight-num">{f.flight.iata}</span>
                    <span className="flight-date-label">{fmtDate(f.departure.scheduled)}</span>
                  </div>

                  {/* 出发 → 到达 */}
                  <div className="route-row">
                    <div className="route-point">
                      <span className="r-time">{fmtTime(f.departure.actual ?? f.departure.scheduled)}</span>
                      <span className="r-iata">{f.departure.iata}</span>
                      <span className="r-city">{f.departure.airport}</span>
                    </div>

                    <div className="route-mid">
                      <div className="r-line" />
                      <span className={statusClass(f.flight_status)}>
                        {statusLabel(f.flight_status)}
                      </span>
                    </div>

                    <div className="route-point">
                      <span className="r-time">{fmtTime(f.arrival.actual ?? f.arrival.scheduled)}</span>
                      <span className="r-iata">{f.arrival.iata}</span>
                      <span className="r-city">{f.arrival.airport}</span>
                    </div>
                  </div>

                  {/* 下方：详细信息 */}
                  <div className="card-footer">
                    <span className="card-meta">
                      航空公司：<strong>{f.airline.name}</strong>
                    </span>
                    {f.departure.terminal && (
                      <span className="card-meta">
                        出发航站楼：<strong>T{f.departure.terminal}</strong>
                      </span>
                    )}
                    {f.arrival.terminal && (
                      <span className="card-meta">
                        到达航站楼：<strong>T{f.arrival.terminal}</strong>
                      </span>
                    )}
                    {f.departure.delay != null && f.departure.delay > 0 && (
                      <span className="card-meta" style={{ color: '#dc2626' }}>
                        延误：<strong>{f.departure.delay} 分钟</strong>
                      </span>
                    )}
                    {f.arrival.baggage && (
                      <span className="card-meta">
                        行李转盘：<strong>{f.arrival.baggage}</strong>
                      </span>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
