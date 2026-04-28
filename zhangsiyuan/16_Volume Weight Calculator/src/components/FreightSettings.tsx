"use client";

import { useApp } from '@/context/AppContext';
import { translations, Language } from '@/data/translations';

const DIM_UNITS = ['cm', 'inch', 'm', 'ft'];
const WEIGHT_UNITS = ['kg', 'lb'];
const MODES = ['air', 'express', 'custom'] as const;

export function FreightSettings() {
  const { language, dimUnit, weightUnit, freightMode, divisor,
    setDimUnit, setWeightUnit, setFreightMode, setDivisor } = useApp();
  const t = translations[language as Language];

  const modeBtnLabel = (m: string) =>
    m === 'air' ? t.airBtn : m === 'express' ? t.expressBtn : t.customBtn;

  return (
    <div className="settings-bar">
      <div className="settings-group">
        <span className="settings-label">{t.dimensionUnit}</span>
        <div className="btn-group">
          {DIM_UNITS.map(u => (
            <button
              key={u}
              className={`unit-btn${dimUnit === u ? ' active' : ''}`}
              onClick={() => setDimUnit(u)}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <span className="settings-label">{t.weightUnit}</span>
        <div className="btn-group">
          {WEIGHT_UNITS.map(u => (
            <button
              key={u}
              className={`unit-btn${weightUnit === u ? ' active' : ''}`}
              onClick={() => setWeightUnit(u)}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <span className="settings-label">{t.freightMode}</span>
        <div className="btn-group">
          {MODES.map(m => (
            <button
              key={m}
              className={`unit-btn${freightMode === m ? ' active' : ''}`}
              onClick={() => setFreightMode(m)}
            >
              {modeBtnLabel(m)}
            </button>
          ))}
        </div>
      </div>

      {freightMode === 'custom' && (
        <div className="settings-group">
          <span className="settings-label">{t.divisorLabel}</span>
          <input
            type="number"
            className="divisor-input"
            value={divisor}
            min={1}
            step={100}
            onChange={e => setDivisor(Number(e.target.value))}
          />
        </div>
      )}
    </div>
  );
}
