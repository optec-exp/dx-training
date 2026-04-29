'use client';

import { useState, useMemo } from 'react';

// ── 航线默认运价 (CNY/kg) ──────────────────────────────────────────────
const ROUTES = [
  { label: '上海 → 东京', baseRate: 28 },
  { label: '上海 → 香港', baseRate: 15 },
  { label: '上海 → 法兰克福', baseRate: 42 },
  { label: '上海 → 纽约', baseRate: 55 },
  { label: '上海 → 迪拜', baseRate: 38 },
  { label: '上海 → 新加坡', baseRate: 22 },
];

// ── 运输方式 ───────────────────────────────────────────────────────────
const TRANSPORT_MODES = [
  { key: 'air', label: '空运 Normal', divisor: 6000 },
  { key: 'obc', label: 'OBC（机上托运）', divisor: 5000 },
  { key: 'express', label: '快递', divisor: 5000 },
] as const;
type TransportMode = (typeof TRANSPORT_MODES)[number]['key'];

// ── 附加费定义 ─────────────────────────────────────────────────────────
const SURCHARGES = [
  { key: 'fsc', label: '燃油附加费 (FSC)', rate: 8.0, unit: 'kg' },
  { key: 'ssc', label: '安全附加费 (SSC)', rate: 3.5, unit: 'kg' },
  { key: 'dgr', label: '危险品附加费 (DGR)', rate: 20.0, unit: 'kg' },
  { key: 'col', label: '冷链附加费 (COL)', rate: 15.0, unit: 'kg' },
  { key: 'doc', label: '文件费', rate: 250.0, unit: 'ticket' },
] as const;
type SurchargeKey = (typeof SURCHARGES)[number]['key'];

// ── 货币 ───────────────────────────────────────────────────────────────
const CURRENCIES = [
  { key: 'CNY', label: '人民币 CNY', rate: 1 },
  { key: 'JPY', label: '日元 JPY', rate: 20 },
  { key: 'USD', label: '美元 USD', rate: 0.14 },
] as const;
type CurrencyKey = (typeof CURRENCIES)[number]['key'];

function fmt(n: number, decimals = 2) {
  return n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function FreightEstimator() {
  // ── 表单状态 ─────────────────────────────────────────────────────────
  const [mode, setMode] = useState<TransportMode>('air');
  const [routeIdx, setRouteIdx] = useState(0);
  const [actualWeight, setActualWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [customRate, setCustomRate] = useState('');
  const [selectedSurcharges, setSelectedSurcharges] = useState<Set<SurchargeKey>>(new Set());
  const [currency, setCurrency] = useState<CurrencyKey>('CNY');
  const [copied, setCopied] = useState(false);

  // ── 计算逻辑 ─────────────────────────────────────────────────────────
  const calc = useMemo(() => {
    const modeInfo = TRANSPORT_MODES.find((m) => m.key === mode)!;
    const currInfo = CURRENCIES.find((c) => c.key === currency)!;
    const route = ROUTES[routeIdx];

    const aw = parseFloat(actualWeight) || 0;
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;

    const volWeight = l && w && h ? (l * w * h) / modeInfo.divisor : 0;
    const chargeWeight = Math.max(aw, volWeight);

    const baseRateCNY =
      customRate !== '' ? parseFloat(customRate) || 0 : route.baseRate;

    const baseFreight = chargeWeight * baseRateCNY;

    const surchargeDetails = SURCHARGES.map((s) => {
      if (!selectedSurcharges.has(s.key)) return { ...s, amount: 0 };
      const amount =
        s.unit === 'ticket' ? s.rate : chargeWeight * s.rate;
      return { ...s, amount };
    });

    const surchargeTotal = surchargeDetails.reduce((sum, s) => sum + s.amount, 0);
    const totalCNY = baseFreight + surchargeTotal;

    const convert = (cny: number) => cny * currInfo.rate;

    return {
      volWeight,
      chargeWeight,
      baseRateCNY,
      baseFreight: convert(baseFreight),
      surchargeDetails: surchargeDetails.map((s) => ({
        ...s,
        amount: convert(s.amount),
      })),
      total: convert(totalCNY),
      currSymbol: currency,
      currRate: currInfo.rate,
    };
  }, [mode, routeIdx, actualWeight, length, width, height, customRate, selectedSurcharges, currency]);

  // ── 切换附加费 ───────────────────────────────────────────────────────
  function toggleSurcharge(key: SurchargeKey) {
    setSelectedSurcharges((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // ── 切换运输方式 → 重置自定义运价 ────────────────────────────────────
  function handleModeChange(m: TransportMode) {
    setMode(m);
    setCustomRate('');
  }

  // ── 切换航线 → 重置自定义运价 ─────────────────────────────────────────
  function handleRouteChange(idx: number) {
    setRouteIdx(idx);
    setCustomRate('');
  }

  // ── 一键复制 ─────────────────────────────────────────────────────────
  function copyQuote() {
    const route = ROUTES[routeIdx];
    const today = new Date().toISOString().slice(0, 10);
    const lines = [
      '【OPTEC 运费报价】',
      `航线：${route.label.replace(' → ', '→')}`,
      `货物：${actualWeight || '0'}kg / 体积重${fmt(calc.volWeight)}kg / 计费重${fmt(calc.chargeWeight)}kg`,
      `基本运费：¥${fmt(calc.baseFreight)}`,
      ...calc.surchargeDetails
        .filter((s) => s.amount > 0)
        .map((s) => `${s.label}：¥${fmt(s.amount)}`),
      '──────────',
      `合计：¥${fmt(calc.total)} ${currency}`,
      `（报价日期：${today}）`,
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── UI ───────────────────────────────────────────────────────────────
  const accent = '#0f766e';

  return (
    <div className="min-h-screen py-8 px-4">
      {/* 标题 */}
      <div className="max-w-6xl mx-auto mb-6">
        <h1 className="text-2xl font-bold" style={{ color: accent }}>
          ✈ 运费快速估算器
        </h1>
        <p className="text-sm text-gray-500 mt-1">OPTEC 财务部门 · 空运报价参考工具</p>
      </div>

      {/* 运输方式 — 顶部大按钮 */}
      <div className="max-w-6xl mx-auto mb-4 flex gap-3 flex-wrap">
        {TRANSPORT_MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => handleModeChange(m.key)}
            className="flex-1 min-w-[140px] py-3 rounded-2xl text-base font-semibold border-2 transition-all shadow-sm"
            style={
              mode === m.key
                ? { background: accent, color: '#fff', borderColor: accent }
                : { background: '#fff', color: '#374151', borderColor: '#d1d5db' }
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* ── 左侧输入区 ───────────────────────────────────────────────── */}
        <div className="flex-1 space-y-5">

          {/* 航线 */}
          <Section title="航线选择">
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': accent } as React.CSSProperties}
              value={routeIdx}
              onChange={(e) => handleRouteChange(Number(e.target.value))}
            >
              {ROUTES.map((r, i) => (
                <option key={i} value={i}>
                  {r.label}（默认 {r.baseRate} CNY/kg）
                </option>
              ))}
            </select>
          </Section>

          {/* 货物信息 */}
          <Section title="货物信息">
            <div className="grid grid-cols-2 gap-3">
              <LabelInput
                label="实重 (kg)"
                value={actualWeight}
                onChange={setActualWeight}
                placeholder="0.0"
              />
              <LabelInput
                label="长 (cm)"
                value={length}
                onChange={setLength}
                placeholder="0"
              />
              <LabelInput
                label="宽 (cm)"
                value={width}
                onChange={setWidth}
                placeholder="0"
              />
              <LabelInput
                label="高 (cm)"
                value={height}
                onChange={setHeight}
                placeholder="0"
              />
            </div>
            {calc.volWeight > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                体积重 = {length}×{width}×{height} ÷{' '}
                {TRANSPORT_MODES.find((m) => m.key === mode)!.divisor} ={' '}
                <strong>{fmt(calc.volWeight)} kg</strong>　→　计费重{' '}
                <strong style={{ color: accent }}>{fmt(calc.chargeWeight)} kg</strong>
              </p>
            )}
          </Section>

          {/* 费率 */}
          <Section title="基本运价 (CNY/kg)">
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': accent } as React.CSSProperties}
              placeholder={`默认 ${ROUTES[routeIdx].baseRate} CNY/kg（可手动覆盖）`}
              value={customRate}
              onChange={(e) => setCustomRate(e.target.value)}
            />
          </Section>

          {/* 附加费 */}
          <Section title="附加费选择（多选）">
            <div className="space-y-2">
              {SURCHARGES.map((s) => (
                <label key={s.key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSurcharges.has(s.key)}
                    onChange={() => toggleSurcharge(s.key)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: accent }}
                  />
                  <span className="text-sm text-gray-700">
                    {s.label}
                    <span className="ml-2 text-gray-400 text-xs">
                      {s.unit === 'ticket'
                        ? `¥${s.rate}/票`
                        : `¥${s.rate}/kg`}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </Section>

          {/* 货币 */}
          <Section title="报价货币">
            <div className="flex gap-2 flex-wrap">
              {CURRENCIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCurrency(c.key)}
                  className="px-4 py-2 rounded-full text-sm font-medium border transition-all"
                  style={
                    currency === c.key
                      ? { background: accent, color: '#fff', borderColor: accent }
                      : { background: '#fff', color: '#374151', borderColor: '#d1d5db' }
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
            {currency !== 'CNY' && (
              <p className="text-xs text-gray-400 mt-2">
                使用固定汇率：1 CNY ={' '}
                {CURRENCIES.find((c) => c.key === currency)!.rate} {currency}
              </p>
            )}
          </Section>
        </div>

        {/* ── 右侧结果面板 ──────────────────────────────────────────────── */}
        <div className="lg:w-80">
          <div
            className="rounded-2xl p-6 sticky top-6 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)', color: '#fff' }}
          >
            <h2 className="text-lg font-bold mb-4 tracking-wide">📋 实时估算结果</h2>

            {/* 计费重 */}
            <ResultRow
              label="计费重"
              value={`${fmt(calc.chargeWeight)} kg`}
              light
            />

            {/* 分隔 */}
            <div className="my-3 border-t border-white/30" />

            {/* 基本运费 */}
            <ResultRow
              label={`基本运费（${fmt(calc.baseRateCNY)} CNY/kg）`}
              value={`${currency} ${fmt(calc.baseFreight)}`}
            />

            {/* 各附加费 */}
            {calc.surchargeDetails
              .filter((s) => s.amount > 0)
              .map((s) => (
                <ResultRow
                  key={s.key}
                  label={s.label}
                  value={`${currency} ${fmt(s.amount)}`}
                />
              ))}

            {/* 分隔 */}
            <div className="my-4 border-t border-white/50" />

            {/* 合计 */}
            <div className="text-center">
              <p className="text-sm opacity-80 mb-1">合计运费</p>
              <p className="text-4xl font-extrabold tracking-tight">
                {currency}&nbsp;{fmt(calc.total)}
              </p>
            </div>

            {/* 复制按钮 */}
            <button
              onClick={copyQuote}
              className="mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: '#fff', color: accent }}
            >
              {copied ? '✅ 已复制到剪贴板' : '📄 一键复制报价单'}
            </button>

            {/* 提示 */}
            <p className="text-xs opacity-60 mt-3 text-center leading-relaxed">
              本估算仅供参考，最终运费以实际账单为准
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 小组件 ──────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function LabelInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="number"
        min="0"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ResultRow({
  label,
  value,
  light,
}: {
  label: string;
  value: string;
  light?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className={`text-xs ${light ? 'opacity-70' : 'opacity-85'}`}>{label}</span>
      <span className={`text-sm font-semibold ${light ? 'opacity-80' : ''}`}>{value}</span>
    </div>
  );
}
