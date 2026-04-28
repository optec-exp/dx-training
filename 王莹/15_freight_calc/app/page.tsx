'use client';
import { useState } from 'react';

// ── 地区费率表（CNY/kg，虚拟参考费率）──────────────────
const REGIONS = [
  { id: 'jp',    label: '日本',   rate: 28,  warRisk: false },
  { id: 'sea',   label: '东南亚', rate: 32,  warRisk: false },
  { id: 'kr',    label: '韩国',   rate: 25,  warRisk: false },
  { id: 'eu',    label: '欧洲',   rate: 52,  warRisk: false },
  { id: 'us',    label: '北美',   rate: 58,  warRisk: false },
  { id: 'au',    label: '澳洲',   rate: 48,  warRisk: false },
  { id: 'me',    label: '中东',   rate: 45,  warRisk: true  },
  { id: 'sa',    label: '南亚',   rate: 38,  warRisk: false },
];

// 附加费（CNY/kg）
const FSC = 8;     // 燃油附加费
const SSC = 3;     // 安全附加费
const WAR = 5;     // 战争险附加费
const PEAK = 6;    // 旺季附加费

// 体积重换算（航空 IATA 标准：长×宽×高(cm) ÷ 6000 = kg）

type Result = {
  actualWeight: number;
  volWeight: number;
  chargeableWeight: number;
  chargeableBasis: 'actual' | 'volume';
  freightBase: number;
  fsc: number;
  ssc: number;
  war: number;
  peak: number;
  total: number;
  region: string;
};

export default function FreightCalcPage() {
  const [actualWeight, setActualWeight] = useState('');
  const [length, setLength]     = useState('');
  const [width, setWidth]       = useState('');
  const [height, setHeight]     = useState('');
  const [pieces, setPieces]     = useState('1');
  const [region, setRegion]     = useState('');
  const [addWar, setAddWar]     = useState(false);
  const [addPeak, setAddPeak]   = useState(false);
  const [result, setResult]     = useState<Result | null>(null);
  const [error, setError]       = useState('');

  function calculate() {
    setError('');
    const aw = parseFloat(actualWeight);
    const l  = parseFloat(length);
    const w  = parseFloat(width);
    const h  = parseFloat(height);
    const pc = parseInt(pieces) || 1;

    if (!aw || aw <= 0) { setError('请输入有效的实际重量'); return; }
    if (!region)        { setError('请选择目的地区域'); return; }

    const reg = REGIONS.find(r => r.id === region)!;

    // 体积重（只有三边都有值才计算）
    let volWeight = 0;
    if (l > 0 && w > 0 && h > 0) {
      volWeight = (l * w * h * pc) / 6000;
    }

    const chargeableWeight = Math.max(aw, volWeight);
    const cw = Math.ceil(chargeableWeight * 2) / 2; // 按0.5kg进位

    const freightBase = cw * reg.rate;
    const fscAmt      = cw * FSC;
    const sscAmt      = cw * SSC;
    const warAmt      = (addWar || reg.warRisk) ? cw * WAR : 0;
    const peakAmt     = addPeak ? cw * PEAK : 0;
    const total       = freightBase + fscAmt + sscAmt + warAmt + peakAmt;

    setResult({
      actualWeight: aw,
      volWeight: volWeight > 0 ? Math.round(volWeight * 100) / 100 : 0,
      chargeableWeight: cw,
      chargeableBasis: volWeight > aw ? 'volume' : 'actual',
      freightBase,
      fsc: fscAmt,
      ssc: sscAmt,
      war: warAmt,
      peak: peakAmt,
      total,
      region: reg.label,
    });
  }

  function reset() {
    setActualWeight(''); setLength(''); setWidth(''); setHeight('');
    setPieces('1'); setRegion(''); setAddWar(false); setAddPeak(false);
    setResult(null); setError('');
  }

  return (
    <div className="bg-[#f8f9fc] min-h-screen">

      {/* Header */}
      <header className="bg-[#0a1628] shadow-md">
        <div className="max-w-4xl mx-auto px-8 py-4 flex items-center gap-3">
          <div className="w-5 h-5 bg-[#c9a84c] rounded-sm"></div>
          <span className="text-white text-sm font-bold tracking-widest">OPTEC EXPRESS</span>
          <span className="text-blue-400 text-xs ml-2">/ 航空货运费用模拟器</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="text-center mb-10">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-2">Freight Calculator</p>
          <h1 className="text-2xl font-bold text-[#0a1628] mb-2">航空货运费用模拟器</h1>
          <p className="text-gray-400 text-sm">输入货物信息，即时估算运费参考价格</p>
          <p className="text-gray-300 text-xs mt-1">※ 本工具仅供参考，实际报价请联系我们</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* 左：输入表单 */}
          <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">

            {/* 重量 */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                📦 货物重量
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  min="0"
                  value={actualWeight}
                  onChange={e => setActualWeight(e.target.value)}
                  placeholder="实际重量"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0a1628]"
                />
                <span className="text-gray-400 text-sm">kg</span>
              </div>
            </div>

            {/* 尺寸（体积重） */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                📐 货物尺寸（体积重计算）
              </label>
              <p className="text-gray-300 text-xs mb-3">长 × 宽 × 高（cm）× 件数 ÷ 6,000 = 体积重（kg）</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { val: length, set: setLength, ph: '长 cm' },
                  { val: width,  set: setWidth,  ph: '宽 cm' },
                  { val: height, set: setHeight, ph: '高 cm' },
                  { val: pieces, set: setPieces, ph: '件数' },
                ].map(({ val, set, ph }) => (
                  <input
                    key={ph}
                    type="number"
                    min="0"
                    value={val}
                    onChange={e => set(e.target.value)}
                    placeholder={ph}
                    className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#0a1628] text-center"
                  />
                ))}
              </div>
            </div>

            {/* 目的地 */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                🌍 目的地区域
              </label>
              <div className="grid grid-cols-4 gap-2">
                {REGIONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRegion(r.id)}
                    className={`py-2 rounded-lg text-sm font-semibold border-2 transition ${
                      region === r.id
                        ? 'bg-[#0a1628] text-white border-[#0a1628]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#0a1628]'
                    }`}
                  >
                    {r.label}
                    {r.warRisk && <span className="block text-xs opacity-60">⚠️ 战区</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 附加费选项 */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                ➕ 可选附加费
              </label>
              <div className="space-y-2">
                {[
                  { val: addWar,  set: setAddWar,  label: '战争险附加费（WAR）', sub: `+CNY ${WAR}/kg`, disabled: REGIONS.find(r=>r.id===region)?.warRisk },
                  { val: addPeak, set: setAddPeak, label: '旺季附加费（PEAK）', sub: `+CNY ${PEAK}/kg`, disabled: false },
                ].map(({ val, set, label, sub, disabled }) => (
                  <label key={label} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    val || disabled ? 'border-[#0a1628] bg-[#0a1628]/5' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={!!(val || disabled)}
                      onChange={e => !disabled && set(e.target.checked)}
                      className="w-4 h-4 accent-[#0a1628]"
                      readOnly={!!disabled}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      {disabled && <span className="text-xs text-orange-500 ml-2">自动适用</span>}
                    </div>
                    <span className="text-xs text-gray-400">{sub}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={calculate}
                className="flex-1 bg-[#0a1628] text-white font-bold py-3 rounded-lg hover:bg-[#0f2557] transition"
              >
                计算估算费用
              </button>
              <button
                onClick={reset}
                className="px-5 border border-gray-200 text-gray-400 rounded-lg hover:border-gray-400 transition text-sm"
              >
                重置
              </button>
            </div>
          </div>

          {/* 右：结果 */}
          <div>
            {!result ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 h-full flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-4">✈️</div>
                <p className="text-gray-400 text-sm">填写左侧货物信息<br />点击计算查看估算费用</p>
                <div className="mt-6 text-left w-full space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">费率说明</p>
                  {REGIONS.map(r => (
                    <div key={r.id} className="flex justify-between text-xs text-gray-500">
                      <span>{r.label}</span>
                      <span className="font-medium">CNY {r.rate}/kg</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 pt-2 space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>燃油附加费（FSC）</span><span>CNY {FSC}/kg</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>安全附加费（SSC）</span><span>CNY {SSC}/kg</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#0a1628] to-[#0f2557] p-6 text-white">
                  <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-3">估算结果</p>
                  {/* 重量对比 */}
                  <div className="flex gap-3 mb-4">
                    <div className={`flex-1 rounded-lg px-3 py-2 text-center text-xs ${result.chargeableBasis === 'actual' ? 'bg-[#c9a84c] text-[#0a1628]' : 'bg-white/10 text-blue-200'}`}>
                      <div className="font-bold text-sm">{result.actualWeight} kg</div>
                      <div>实际重量{result.chargeableBasis === 'actual' ? ' ✓ 采用' : ''}</div>
                    </div>
                    {result.volWeight > 0 && (
                      <div className={`flex-1 rounded-lg px-3 py-2 text-center text-xs ${result.chargeableBasis === 'volume' ? 'bg-[#c9a84c] text-[#0a1628]' : 'bg-white/10 text-blue-200'}`}>
                        <div className="font-bold text-sm">{result.volWeight} kg</div>
                        <div>体积重量{result.chargeableBasis === 'volume' ? ' ✓ 采用' : ''}</div>
                      </div>
                    )}
                    <div className="flex-1 bg-white/20 rounded-lg px-3 py-2 text-center text-xs">
                      <div className="font-bold text-sm">{result.chargeableWeight} kg</div>
                      <div>计费重量</div>
                    </div>
                  </div>
                  <h2 className="text-3xl font-black mb-1">
                    CNY {result.total.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </h2>
                  <p className="text-blue-300 text-xs">目的地：{result.region}</p>
                </div>

                <div className="p-6 space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">费用明细</p>
                  {[
                    { label: `航空运费（${result.region}）`, amount: result.freightBase, highlight: false },
                    { label: '燃油附加费（FSC）', amount: result.fsc, highlight: false },
                    { label: '安全附加费（SSC）', amount: result.ssc, highlight: false },
                    ...(result.war  > 0 ? [{ label: '战争险附加费（WAR）', amount: result.war,  highlight: false }] : []),
                    ...(result.peak > 0 ? [{ label: '旺季附加费（PEAK）',  amount: result.peak, highlight: false }] : []),
                  ].map(({ label, amount }) => (
                    <div key={label} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-medium text-gray-800">
                        CNY {amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between font-black text-[#0a1628] text-base pt-2 border-t-2 border-[#0a1628]">
                    <span>合计</span>
                    <span>CNY {result.total.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>

                  <div className="bg-[#f8f9fc] rounded-xl p-4 mt-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">计重说明</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      计费重量取实际重量与体积重（长×宽×高×件数÷6,000）中较大值，按0.5kg向上进位。
                    </p>
                  </div>

                  <p className="text-gray-300 text-xs text-center pt-2">
                    ※ 以上为参考估算价格，实际报价请联系 OPTEC EXPRESS
                  </p>

                  <button
                    onClick={() => setResult(null)}
                    className="w-full mt-2 border border-gray-200 text-gray-500 py-2 rounded-lg text-sm hover:border-[#0a1628] transition"
                  >
                    重新计算
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
