"use client";

import { useApp } from '@/context/AppContext';
import { translations, Language } from '@/data/translations';
import { CARGO_COLORS } from '@/lib/canvasDrawing';

function fmt(v: number, digits = 2) {
  return v.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtVol(cm3: number) {
  if (cm3 >= 1_000_000) return `${(cm3 / 1_000_000).toFixed(4)} m³`;
  if (cm3 >= 1_000) return `${(cm3 / 1_000).toFixed(2)} L`;
  return `${cm3.toFixed(0)} cm³`;
}

export function CargoResultTable() {
  const { language, dimUnit, weightUnit, items, results, removeItem } = useApp();
  const t = translations[language as Language];

  if (!items.length) {
    return (
      <div className="card empty-state">
        <div className="empty-icon">📋</div>
        <p className="empty-title">{t.noItems}</p>
        <p className="empty-sub">{t.addFirst}</p>
      </div>
    );
  }

  return (
    <div className="card table-card">
      <div className="table-scroll">
        <table className="cargo-table">
          <thead>
            <tr>
              <th style={{ width: 16 }}></th>
              <th>{t.typeCol}</th>
              <th>{t.dimsCol}</th>
              <th className="ta-r">{t.qtyCol}</th>
              <th className="ta-r">{t.volPieceCol}</th>
              <th className="ta-r">{t.volWtPieceCol}</th>
              <th className="ta-r">{t.totalVolWtCol}</th>
              <th className="ta-r">{t.actualWtCol}</th>
              <th className="ta-r th-chargeable">{t.chargeableCol}</th>
              <th className="ta-c">{t.basisCol}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const r = results[i];
              if (!r) return null;
              const color = CARGO_COLORS[i % CARGO_COLORS.length];
              return (
                <tr key={item.id}>
                  <td>
                    <span className="color-dot" style={{ background: color.stroke }} />
                  </td>
                  <td className="td-name">{item.name}</td>
                  <td className="td-dims">
                    {item.length}&thinsp;×&thinsp;{item.width}&thinsp;×&thinsp;{item.height}&thinsp;{dimUnit}
                  </td>
                  <td className="ta-r">{item.quantity}</td>
                  <td className="ta-r td-mono">{fmtVol(r.volPerPieceCm3)}</td>
                  <td className="ta-r td-mono">{fmt(r.volWtPerPiece)} {weightUnit}</td>
                  <td className="ta-r td-mono">{fmt(r.totalVolWt)} {weightUnit}</td>
                  <td className="ta-r td-mono">{fmt(r.totalActualWt)} {weightUnit}</td>
                  <td className="ta-r td-mono td-chargeable">{fmt(r.chargeableWt)} {weightUnit}</td>
                  <td className="ta-c">
                    <span className={`basis-badge${r.isVolumetric ? ' basis-vol' : ' basis-wt'}`}>
                      {r.isVolumetric ? t.byVolume : t.byActual}
                    </span>
                  </td>
                  <td>
                    <button className="remove-btn" onClick={() => removeItem(item.id)}>
                      {t.removeBtn}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
