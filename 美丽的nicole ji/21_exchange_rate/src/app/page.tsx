'use client';

import { useState, useEffect } from 'react';

// ── 类型定义 ──────────────────────────────────────────────
interface RatesData {
  rates: { USD: number; EUR: number; CNY: number };
  lastUpdate: string;
}
type Currency = 'USD' | 'EUR' | 'CNY';
type Direction = 'toJPY' | 'fromJPY';

// ── 货币信息 ──────────────────────────────────────────────
const CURRENCIES: Record<Currency, { label: string; flag: string; symbol: string }> = {
  USD: { label: '美元 USD', flag: '🇺🇸', symbol: '$' },
  EUR: { label: '欧元 EUR', flag: '🇪🇺', symbol: '€' },
  CNY: { label: '人民币 CNY', flag: '🇨🇳', symbol: '¥' },
};

// ── 样式常量 ──────────────────────────────────────────────
const C = {
  bg:     '#0a0f1e',
  card:   'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)',
  text:   '#e2e8f0',
  muted:  '#94a3b8',
  accent: '#60a5fa',
  green:  '#34d399',
  red:    '#f87171',
};

export default function Home() {
  const [data, setData]           = useState<RatesData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [amount, setAmount]       = useState('1');
  const [currency, setCurrency]   = useState<Currency>('USD');
  const [direction, setDirection] = useState<Direction>('toJPY');

  // ── 获取汇率数据 ──────────────────────────────────────────
  useEffect(() => {
    fetch('/api/rates')
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

  // ── 换算逻辑 ──────────────────────────────────────────────
  // API 返回的 rates 以 JPY 为基准：1 JPY = ? USD
  // 所以 1 USD = 1/rates.USD JPY
  const jpyPerUnit = (cur: Currency) => (data ? 1 / data.rates[cur] : 0);

  const calcResult = (): string => {
    if (!data) return '—';
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) return '—';
    if (direction === 'toJPY') {
      return (num / data.rates[currency]).toLocaleString('ja-JP', { maximumFractionDigits: 2 });
    } else {
      return (num * data.rates[currency]).toLocaleString('en-US', { maximumFractionDigits: 4 });
    }
  };

  const fromLabel  = direction === 'toJPY' ? currency : 'JPY';
  const toLabel    = direction === 'toJPY' ? 'JPY' : currency;
  const fromSymbol = direction === 'toJPY' ? CURRENCIES[currency].symbol : '¥';
  const toSymbol   = direction === 'toJPY' ? '¥' : CURRENCIES[currency].symbol;

  const fmtDate = (s: string) => {
    try {
      return new Date(s).toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo',
      }) + ' JST';
    } catch { return s; }
  };

  // ── 页面 ──────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 16px', fontFamily: 'sans-serif' }}>

      {/* 标题 */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>
          汇率显示应用
        </h1>
        <p style={{ color: C.muted, marginTop: 8, fontSize: 14 }}>
          USD / EUR / CNY ↔ JPY　实时换算
        </p>
      </div>

      {/* 加载中 */}
      {loading && (
        <div style={{ textAlign: 'center', marginTop: 60, color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p>正在获取汇率数据...</p>
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

      {/* 主要内容 */}
      {!loading && !error && data && (
        <div style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 汇率卡片 × 3 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {(Object.keys(CURRENCIES) as Currency[]).map(cur => (
              <div key={cur} style={{ background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 16, padding: '20px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{CURRENCIES[cur].flag}</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{cur}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.accent }}>
                  ¥{jpyPerUnit(cur).toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>per 1 {cur}</div>
              </div>
            ))}
          </div>

          {/* 换算工具 */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: C.accent, margin: '0 0 20px' }}>
              换算工具
            </h2>

            {/* 货币选择按钮 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {(Object.keys(CURRENCIES) as Currency[]).map(cur => (
                <button key={cur} onClick={() => setCurrency(cur)}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: currency === cur ? C.accent : 'rgba(255,255,255,0.08)',
                    color: currency === cur ? '#fff' : C.muted }}>
                  {CURRENCIES[cur].flag} {cur}
                </button>
              ))}
            </div>

            {/* 方向切换 */}
            <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden',
              border: `1px solid ${C.border}`, marginBottom: 18 }}>
              {(['toJPY', 'fromJPY'] as Direction[]).map(dir => (
                <button key={dir} onClick={() => setDirection(dir)}
                  style={{ flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    background: direction === dir ? C.green : 'rgba(255,255,255,0.05)',
                    color: direction === dir ? '#fff' : C.muted }}>
                  {dir === 'toJPY' ? `${currency} → JPY` : `JPY → ${currency}`}
                </button>
              ))}
            </div>

            {/* 金额输入 */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>
                金额（{fromLabel}）
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: C.muted, fontFamily: 'monospace' }}>{fromSymbol}</span>
                <input type="number" min="0" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${C.border}`, borderRadius: 10,
                    padding: '12px 12px 12px 28px', color: C.text, fontSize: 18,
                    fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* 换算结果 */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
              borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
                换算结果（{toLabel}）
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'monospace', color: C.green }}>
                {toSymbol}{calcResult()}
              </div>
            </div>
          </div>

          {/* 最后更新时间 */}
          <p style={{ textAlign: 'center', fontSize: 12, color: C.muted, margin: 0 }}>
            最后更新：{fmtDate(data.lastUpdate)}
          </p>
        </div>
      )}
    </main>
  );
}
