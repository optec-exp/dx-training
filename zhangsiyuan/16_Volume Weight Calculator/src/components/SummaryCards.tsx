"use client";

import { useApp } from '@/context/AppContext';
import { translations, Language } from '@/data/translations';

function fmt(v: number, d = 2) {
  return v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function SummaryCards() {
  const { language, weightUnit, totals, results } = useApp();
  const t = translations[language as Language];
  if (!results.length) return null;

  const cbm = (totals.totalVolCm3 / 1_000_000).toFixed(4);
  const allVol = results.every(r => r.isVolumetric);
  const allActual = results.every(r => !r.isVolumetric);
  const verdictKey = allVol ? t.byVolume : allActual ? t.byActual : `${t.byVolume} / ${t.byActual}`;

  return (
    <section className="summary-section">
      <h2 className="section-title">{t.summaryTitle}</h2>
      <div className="summary-grid">
        {/* Total Volume */}
        <div className="summary-card">
          <div className="summary-icon">📐</div>
          <div className="summary-value">{cbm}</div>
          <div className="summary-unit">{t.cbmUnit}</div>
          <div className="summary-label">{t.totalVolumeLabel}</div>
        </div>

        {/* Total Volumetric Weight */}
        <div className="summary-card">
          <div className="summary-icon">🧊</div>
          <div className="summary-value">{fmt(totals.totalVolWt)}</div>
          <div className="summary-unit">{weightUnit}</div>
          <div className="summary-label">{t.totalVolWtLabel}</div>
        </div>

        {/* Total Actual Weight */}
        <div className="summary-card">
          <div className="summary-icon">⚖️</div>
          <div className="summary-value">{fmt(totals.totalActualWt)}</div>
          <div className="summary-unit">{weightUnit}</div>
          <div className="summary-label">{t.totalActualWtLabel}</div>
        </div>

        {/* Total Chargeable Weight — accent card */}
        <div className="summary-card summary-card-accent">
          <div className="summary-icon">💰</div>
          <div className="summary-value">{fmt(totals.totalChargeableWt)}</div>
          <div className="summary-unit">{weightUnit}</div>
          <div className="summary-label">{t.totalChargeableLabel}</div>
          <div className="summary-verdict">{verdictKey}</div>
        </div>
      </div>
    </section>
  );
}
