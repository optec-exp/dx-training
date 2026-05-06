'use client';

import { useState, useEffect } from 'react';

interface RatesData {
  rates: {
    USD: number;
    EUR: number;
    CNY: number;
  };
  lastUpdate: string;
}

type Currency = 'USD' | 'EUR' | 'CNY';
type Direction = 'toJPY' | 'fromJPY';

const CURRENCY_INFO: Record<Currency, { name: string; flag: string; symbol: string }> = {
  USD: { name: '米ドル / 美元', flag: '🇺🇸', symbol: '$' },
  EUR: { name: 'ユーロ / 欧元', flag: '🇪🇺', symbol: '€' },
  CNY: { name: '人民元 / 人民币', flag: '🇨🇳', symbol: '¥' },
};

export default function Home() {
  const [data, setData] = useState<RatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('1');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [direction, setDirection] = useState<Direction>('toJPY');

  useEffect(() => {
    fetch('/api/rates')
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
        setError('ネットワークエラー。接続を確認してください。');
        setLoading(false);
      });
  }, []);

  const jpyPerUnit = (cur: Currency): number => {
    if (!data) return 0;
    return 1 / data.rates[cur];
  };

  const calculateResult = (): string => {
    if (!data) return '—';
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) return '—';

    if (direction === 'toJPY') {
      const result = num / data.rates[currency];
      return result.toLocaleString('ja-JP', { maximumFractionDigits: 2 });
    } else {
      const result = num * data.rates[currency];
      return result.toLocaleString('en-US', { maximumFractionDigits: 4 });
    }
  };

  const fromLabel = direction === 'toJPY' ? currency : 'JPY';
  const toLabel = direction === 'toJPY' ? 'JPY' : currency;
  const fromSymbol = direction === 'toJPY' ? CURRENCY_INFO[currency].symbol : '¥';
  const toSymbol = direction === 'toJPY' ? '¥' : CURRENCY_INFO[currency].symbol;

  const formatLastUpdate = (utcStr: string) => {
    try {
      return new Date(utcStr).toLocaleString('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo',
      }) + ' JST';
    } catch {
      return utcStr;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col items-center justify-start py-12 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          為替レート表示
        </h1>
        <p className="text-blue-300 text-sm">USD / EUR / CNY ↔ JPY リアルタイム換算</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-4 mt-16">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-blue-300 text-sm">レートを取得中...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-xl px-6 py-4 max-w-md text-center">
          <p className="text-red-300 font-medium">⚠ エラー</p>
          <p className="text-red-200 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && data && (
        <div className="w-full max-w-2xl flex flex-col gap-6">
          {/* Rate Cards */}
          <div className="grid grid-cols-3 gap-4">
            {(Object.keys(CURRENCY_INFO) as Currency[]).map((cur) => (
              <div
                key={cur}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center hover:bg-white/15 transition-colors"
              >
                <div className="text-2xl mb-1">{CURRENCY_INFO[cur].flag}</div>
                <div className="text-xs text-blue-300 mb-2">{cur}</div>
                <div className="text-lg font-bold text-white">
                  ¥{jpyPerUnit(cur).toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-400 mt-1">per 1 {cur}</div>
              </div>
            ))}
          </div>

          {/* Converter Card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-blue-200 mb-5">換算ツール</h2>

            {/* Currency Selector */}
            <div className="flex gap-2 mb-4">
              {(Object.keys(CURRENCY_INFO) as Currency[]).map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    currency === cur
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {CURRENCY_INFO[cur].flag} {cur}
                </button>
              ))}
            </div>

            {/* Direction Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-white/20 mb-5">
              <button
                onClick={() => setDirection('toJPY')}
                className={`flex-1 py-2 text-sm font-medium transition-all ${
                  direction === 'toJPY'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {currency} → JPY
              </button>
              <button
                onClick={() => setDirection('fromJPY')}
                className={`flex-1 py-2 text-sm font-medium transition-all ${
                  direction === 'fromJPY'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                JPY → {currency}
              </button>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-1 block">
                金額 ({fromLabel})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                  {fromSymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-8 pr-4 text-white text-lg font-mono focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Result */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-xs text-slate-400 mb-1">換算結果 ({toLabel})</div>
              <div className="text-3xl font-bold font-mono text-emerald-400">
                {toSymbol}{calculateResult()}
              </div>
            </div>
          </div>

          {/* Last Update */}
          <p className="text-center text-xs text-slate-500">
            最終更新: {formatLastUpdate(data.lastUpdate)}
          </p>
        </div>
      )}
    </main>
  );
}
