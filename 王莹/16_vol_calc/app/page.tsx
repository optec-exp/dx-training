'use client';
import { useState } from 'react';

export default function VolCalcPage() {
  const [length,       setLength]       = useState('');
  const [width,        setWidth]        = useState('');
  const [height,       setHeight]       = useState('');
  const [pieces,       setPieces]       = useState('1');
  const [actualWeight, setActualWeight] = useState('');

  const l  = parseFloat(length)  || 0;
  const w  = parseFloat(width)   || 0;
  const h  = parseFloat(height)  || 0;
  const pc = parseInt(pieces)    || 1;
  const aw = parseFloat(actualWeight) || 0;

  const volWeight     = (l > 0 && w > 0 && h > 0) ? Math.round((l * w * h * pc) / 6000 * 100) / 100 : null;
  const chargeWeight  = volWeight !== null ? Math.ceil(Math.max(aw || 0, volWeight) * 2) / 2 : (aw > 0 ? aw : null);
  const basis         = volWeight !== null && aw > 0 ? (volWeight > aw ? 'volume' : 'actual') : null;
  const hasResult     = volWeight !== null || aw > 0;

  function reset() {
    setLength(''); setWidth(''); setHeight(''); setPieces('1'); setActualWeight('');
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0a1628] text-center font-medium";

  return (
    <div className="bg-[#f8f9fc] min-h-screen">

      {/* Header */}
      <header className="bg-[#0a1628] shadow-md">
        <div className="max-w-2xl mx-auto px-8 py-4 flex items-center gap-3">
          <div className="w-5 h-5 bg-[#c9a84c] rounded-sm"></div>
          <span className="text-white text-sm font-bold tracking-widest">OPTEC EXPRESS</span>
          <span className="text-blue-400 text-xs ml-2">/ 体积重量计算工具</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-8 py-10">

        <div className="text-center mb-8">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-2">Volume Weight Calculator</p>
          <h1 className="text-2xl font-bold text-[#0a1628] mb-2">体积重量计算工具</h1>
          <p className="text-gray-400 text-sm">航空货运计费重量 = 实际重量 vs 体积重量，取较大值</p>
        </div>

        {/* 输入卡片 */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">

          {/* 尺寸输入 */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              📐 货物尺寸（cm）
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { val: length, set: setLength, ph: '长', unit: 'L' },
                { val: width,  set: setWidth,  ph: '宽', unit: 'W' },
                { val: height, set: setHeight, ph: '高', unit: 'H' },
                { val: pieces, set: setPieces, ph: '件数', unit: 'PCS' },
              ].map(({ val, set, ph, unit }) => (
                <div key={ph}>
                  <div className="text-center text-xs text-gray-400 mb-1 font-semibold">{unit}</div>
                  <input
                    type="number"
                    min="0"
                    value={val}
                    onChange={e => set(e.target.value)}
                    placeholder={ph}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
            {l > 0 && w > 0 && h > 0 && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                {l} × {w} × {h} × {pc} ÷ 6,000 = <span className="font-semibold text-[#0a1628]">{volWeight} kg</span>
              </p>
            )}
          </div>

          {/* 实际重量 */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              ⚖️ 实际重量（kg）
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                min="0"
                value={actualWeight}
                onChange={e => setActualWeight(e.target.value)}
                placeholder="输入实际重量"
                className={inputClass}
              />
              <span className="text-gray-400 text-sm font-medium">kg</span>
            </div>
          </div>
        </div>

        {/* 结果卡片 */}
        {hasResult && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#0a1628] to-[#0f2557] px-8 py-4">
              <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase">计算结果</p>
            </div>
            <div className="p-8">

              {/* 对比区块 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* 实际重量 */}
                <div className={`rounded-xl p-5 text-center border-2 transition-all ${
                  basis === 'actual'
                    ? 'border-[#c9a84c] bg-[#fefce8]'
                    : 'border-gray-100 bg-gray-50'
                }`}>
                  <div className="text-xs text-gray-400 mb-1">实际重量</div>
                  <div className={`text-2xl font-black mb-1 ${basis === 'actual' ? 'text-[#0a1628]' : 'text-gray-400'}`}>
                    {aw > 0 ? aw : '—'} <span className="text-sm font-medium">kg</span>
                  </div>
                  {basis === 'actual' && (
                    <div className="inline-block bg-[#c9a84c] text-[#0a1628] text-xs font-bold px-2 py-0.5 rounded-full">
                      ✓ 计费基准
                    </div>
                  )}
                </div>

                {/* 体积重量 */}
                <div className={`rounded-xl p-5 text-center border-2 transition-all ${
                  basis === 'volume'
                    ? 'border-[#c9a84c] bg-[#fefce8]'
                    : 'border-gray-100 bg-gray-50'
                }`}>
                  <div className="text-xs text-gray-400 mb-1">体积重量</div>
                  <div className={`text-2xl font-black mb-1 ${basis === 'volume' ? 'text-[#0a1628]' : 'text-gray-400'}`}>
                    {volWeight !== null ? volWeight : '—'} <span className="text-sm font-medium">kg</span>
                  </div>
                  {basis === 'volume' && (
                    <div className="inline-block bg-[#c9a84c] text-[#0a1628] text-xs font-bold px-2 py-0.5 rounded-full">
                      ✓ 计费基准
                    </div>
                  )}
                </div>
              </div>

              {/* 计费重量 */}
              {chargeWeight !== null && (
                <div className="bg-[#0a1628] rounded-xl p-5 text-center">
                  <div className="text-blue-300 text-xs mb-1">计费重量（按 0.5 kg 进位）</div>
                  <div className="text-white text-4xl font-black">
                    {chargeWeight} <span className="text-lg font-medium">kg</span>
                  </div>
                </div>
              )}

              {/* 公式说明 */}
              <div className="mt-4 bg-[#f8f9fc] rounded-xl p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">计算公式</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  体积重量 = 长 × 宽 × 高（cm）× 件数 ÷ 6,000　（IATA 航空标准）<br />
                  计费重量 = max（实际重量，体积重量），按 0.5 kg 向上进位
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 重置按钮 */}
        {hasResult && (
          <button
            onClick={reset}
            className="w-full mt-4 border border-gray-200 text-gray-400 py-3 rounded-xl text-sm hover:border-[#0a1628] hover:text-[#0a1628] transition"
          >
            重置
          </button>
        )}

      </div>
    </div>
  );
}
