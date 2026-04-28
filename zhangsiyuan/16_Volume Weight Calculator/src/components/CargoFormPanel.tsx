"use client";

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { translations, Language } from '@/data/translations';
import { CARGO_COLORS } from '@/lib/canvasDrawing';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const EMPTY = { name: '', length: '', width: '', height: '', quantity: '1', weight: '' };

export function CargoFormPanel() {
  const { language, dimUnit, weightUnit, items, addItem } = useApp();
  const t = translations[language as Language];

  const [form, setForm] = useState(EMPTY);
  const nextColor = CARGO_COLORS[items.length % CARGO_COLORS.length];

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleAdd() {
    const l = parseFloat(form.length);
    const w = parseFloat(form.width);
    const h = parseFloat(form.height);
    const qty = parseInt(form.quantity);
    const wt = parseFloat(form.weight);
    if (!l || !w || !h || !qty || isNaN(wt) || wt < 0) return;
    addItem({
      id: uid(),
      name: form.name.trim() || `${t.typeCol} ${items.length + 1}`,
      length: l, width: w, height: h, quantity: qty, weight: wt,
    });
    setForm(EMPTY);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdd();
  }

  return (
    <div className="card form-card">
      {/* Card header with color swatch showing next item's color */}
      <div className="card-header">
        <span className="color-swatch" style={{ background: nextColor.stroke }} />
        <h2 className="card-title">{t.addCargo}</h2>
      </div>

      {/* Cargo name */}
      <div className="form-field">
        <label className="form-label">{t.cargoName}</label>
        <input
          className="form-input"
          placeholder={t.namePlaceholder}
          value={form.name}
          onChange={e => set('name', e.target.value)}
          onKeyDown={onKey}
        />
      </div>

      {/* L / W / H */}
      <div className="form-row-3">
        {([
          ['length', t.lengthLabel],
          ['width', t.widthLabel],
          ['height', t.heightLabel],
        ] as const).map(([field, label]) => (
          <div className="form-field" key={field}>
            <label className="form-label">{label} ({dimUnit})</label>
            <input
              className="form-input"
              type="number" min="0" step="any"
              value={form[field]}
              onChange={e => set(field, e.target.value)}
              onKeyDown={onKey}
            />
          </div>
        ))}
      </div>

      {/* Qty / Weight */}
      <div className="form-row-2">
        <div className="form-field">
          <label className="form-label">{t.quantityLabel}</label>
          <input
            className="form-input"
            type="number" min="1" step="1"
            value={form.quantity}
            onChange={e => set('quantity', e.target.value)}
            onKeyDown={onKey}
          />
        </div>
        <div className="form-field">
          <label className="form-label">{t.weightPerPiece} ({weightUnit})</label>
          <input
            className="form-input"
            type="number" min="0" step="any"
            value={form.weight}
            onChange={e => set('weight', e.target.value)}
            onKeyDown={onKey}
          />
        </div>
      </div>

      <button className="add-btn" onClick={handleAdd}>
        + {t.addButton}
      </button>
    </div>
  );
}
