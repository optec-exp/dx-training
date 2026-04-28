"use client";

import { useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { translations, Language } from '@/data/translations';
import { buildDrawItems, drawFront, drawSide, drawTop, drawIsometric, CARGO_COLORS } from '@/lib/canvasDrawing';

export function DiagramPanel() {
  const { language, dimUnit, items } = useApp();
  const t = translations[language as Language];

  const isoRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const sideRef = useRef<HTMLCanvasElement>(null);
  const topRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!items.length) return;
    const drawItems = buildDrawItems(items, dimUnit);

    (['iso', 'front', 'side', 'top'] as const).forEach(key => {
      const ref = { iso: isoRef, front: frontRef, side: sideRef, top: topRef }[key];
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (key === 'iso') drawIsometric(ctx, canvas, drawItems);
      if (key === 'front') drawFront(ctx, canvas, drawItems);
      if (key === 'side') drawSide(ctx, canvas, drawItems);
      if (key === 'top') drawTop(ctx, canvas, drawItems);
    });
  }, [items, dimUnit]);

  if (!items.length) return null;

  return (
    <section className="diagram-section">
      <h2 className="section-title">📐 {t.diagramTitle}</h2>

      {/* Legend */}
      <div className="diagram-legend">
        {items.map((item, i) => {
          const color = CARGO_COLORS[i % CARGO_COLORS.length];
          return (
            <div key={item.id} className="legend-item">
              <span className="legend-swatch" style={{ background: color.stroke }} />
              <span className="legend-name">{item.name}</span>
              <span className="legend-dims">
                {item.length}×{item.width}×{item.height} {dimUnit} ×{item.quantity}
              </span>
            </div>
          );
        })}
      </div>

      <p className="diagram-note">{t.diagramNote}</p>

      {/* 2×2 diagram grid */}
      <div className="diagram-grid">
        <div className="diagram-view">
          <canvas ref={isoRef} width={440} height={300} />
        </div>
        <div className="diagram-view">
          <canvas ref={frontRef} width={440} height={300} />
        </div>
        <div className="diagram-view">
          <canvas ref={sideRef} width={440} height={300} />
        </div>
        <div className="diagram-view">
          <canvas ref={topRef} width={440} height={300} />
        </div>
      </div>
    </section>
  );
}
