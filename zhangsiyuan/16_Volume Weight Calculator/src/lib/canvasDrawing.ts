// ── Color palette for cargo types ─────────────────────────────────────────────
export const CARGO_COLORS = [
  { fill: 'rgba(59,130,246,0.28)',  stroke: '#3b82f6', top: 'rgba(147,197,253,0.55)', right: 'rgba(29,78,216,0.45)',  text: '#1d4ed8' },
  { fill: 'rgba(16,185,129,0.28)',  stroke: '#10b981', top: 'rgba(110,231,183,0.55)', right: 'rgba(5,150,105,0.45)',  text: '#047857' },
  { fill: 'rgba(245,158,11,0.28)',  stroke: '#f59e0b', top: 'rgba(252,211,77,0.55)',  right: 'rgba(180,100,0,0.45)',  text: '#92400e' },
  { fill: 'rgba(239,68,68,0.28)',   stroke: '#ef4444', top: 'rgba(252,165,165,0.55)', right: 'rgba(185,28,28,0.45)',  text: '#991b1b' },
  { fill: 'rgba(139,92,246,0.28)',  stroke: '#8b5cf6', top: 'rgba(196,181,253,0.55)', right: 'rgba(109,40,217,0.45)', text: '#5b21b6' },
  { fill: 'rgba(6,182,212,0.28)',   stroke: '#06b6d4', top: 'rgba(103,232,249,0.55)', right: 'rgba(8,145,178,0.45)',  text: '#0e7490' },
  { fill: 'rgba(236,72,153,0.28)',  stroke: '#ec4899', top: 'rgba(249,168,212,0.55)', right: 'rgba(190,24,93,0.45)',  text: '#9d174d' },
  { fill: 'rgba(132,204,22,0.28)',  stroke: '#84cc16', top: 'rgba(190,242,100,0.55)', right: 'rgba(77,124,15,0.45)',  text: '#3f6212' },
] as const;

export type CargoColor = (typeof CARGO_COLORS)[number];

// ── DrawItem: internal drawing data ──────────────────────────────────────────
export interface DrawItem {
  idx: number;
  name: string;
  // dimensions in cm (for positioning/scaling)
  lCm: number;
  wCm: number;
  hCm: number;
  // dimensions in original unit (for labeling)
  lOrig: number;
  wOrig: number;
  hOrig: number;
  dimUnit: string;
  qty: number;
  color: CargoColor;
  xOff: number; // x offset in cm (used for front/top views, L-axis arrangement)
}

const DIM_TO_CM: Record<string, number> = { cm: 1, inch: 2.54, m: 100, ft: 30.48 };
const GAP_CM = 14; // gap between cargo types in the diagram

export function buildDrawItems(
  items: { name: string; length: number; width: number; height: number; quantity: number }[],
  dimUnit: string
): DrawItem[] {
  const conv = DIM_TO_CM[dimUnit] ?? 1;
  let xOff = 0;
  return items.map((item, i) => {
    const lCm = Math.max(item.length * conv, 0.5);
    const wCm = Math.max(item.width * conv, 0.5);
    const hCm = Math.max(item.height * conv, 0.5);
    const di: DrawItem = {
      idx: i,
      name: item.name || `T${i + 1}`,
      lCm, wCm, hCm,
      lOrig: item.length,
      wOrig: item.width,
      hOrig: item.height,
      dimUnit,
      qty: Math.max(item.quantity, 1),
      color: CARGO_COLORS[i % CARGO_COLORS.length],
      xOff,
    };
    xOff += lCm + GAP_CM;
    return di;
  });
}

// ── Canvas utilities ──────────────────────────────────────────────────────────
function setupCanvas(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += 20) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y <= h; y += 20) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
}

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';

function drawViewTitle(ctx: CanvasRenderingContext2D, cw: number, title: string, sub: string) {
  ctx.fillStyle = '#334155';
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(title, cw / 2, 17);
  if (sub) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = `10px ${FONT}`;
    ctx.fillText(sub, cw / 2, 29);
  }
}

function dimLineH(
  ctx: CanvasRenderingContext2D,
  x1: number, x2: number, y: number,
  label: string, color = '#94a3b8'
) {
  if (Math.abs(x2 - x1) < 6) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x1, y - 4); ctx.lineTo(x1, y + 4);
  ctx.moveTo(x2, y - 4); ctx.lineTo(x2, y + 4);
  ctx.moveTo(x1, y); ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = `9px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(label, (x1 + x2) / 2, y + 13);
}

function dimLineV(
  ctx: CanvasRenderingContext2D,
  x: number, y1: number, y2: number,
  label: string, color = '#94a3b8'
) {
  if (Math.abs(y2 - y1) < 6) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x - 4, y1); ctx.lineTo(x + 4, y1);
  ctx.moveTo(x - 4, y2); ctx.lineTo(x + 4, y2);
  ctx.moveTo(x, y1); ctx.lineTo(x, y2);
  ctx.stroke();
  ctx.save();
  ctx.translate(x - 13, (y1 + y2) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = color;
  ctx.font = `9px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

// ── Front View: each type arranged by L, stacked by H ────────────────────────
export function drawFront(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  items: DrawItem[]
) {
  const W = canvas.width, H = canvas.height;
  setupCanvas(ctx, W, H);
  drawViewTitle(ctx, W, 'Front View', 'L × H');
  if (!items.length) return;

  const PAD = { l: 52, r: 18, t: 38, b: 44 };
  const totalL = items[items.length - 1].xOff + items[items.length - 1].lCm;
  const maxH = items.reduce((m, it) => Math.max(m, it.hCm * it.qty), 0);
  if (!totalL || !maxH) return;

  const avW = W - PAD.l - PAD.r;
  const avH = H - PAD.t - PAD.b;
  const scale = Math.min(avW / totalL, avH / maxH, 5);

  const drawW = totalL * scale;
  const ox = PAD.l + (avW - drawW) / 2;
  const oy = PAD.t + avH;

  // Axes
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ox - 2, oy); ctx.lineTo(ox + drawW + 14, oy);
  ctx.moveTo(ox - 2, oy); ctx.lineTo(ox - 2, PAD.t + 4);
  ctx.stroke();

  for (const item of items) {
    const sx = ox + item.xOff * scale;
    const sw = item.lCm * scale;
    const sh = item.hCm * scale;

    // Draw stacked boxes (bottom to top)
    for (let q = 0; q < item.qty; q++) {
      const sy = oy - (q + 1) * sh;
      ctx.fillStyle = item.color.fill;
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = item.color.stroke;
      ctx.lineWidth = q === 0 ? 2 : 0.7;
      ctx.strokeRect(sx, sy, sw, sh);
      // Separator dashes between stacked pieces
      if (q > 0) {
        ctx.save();
        ctx.strokeStyle = item.color.stroke + '80';
        ctx.lineWidth = 0.6;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(sx, sy + sh); ctx.lineTo(sx + sw, sy + sh); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
      }
    }

    // Individual piece H label (inside first box if large enough)
    if (sh > 18) {
      ctx.fillStyle = item.color.text;
      ctx.font = `bold 9px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(`H: ${item.hOrig}`, sx + sw / 2, oy - sh / 2 + 3);
    }

    // Total stack H dim line (left side of each type's stack)
    const stackTop = oy - item.hCm * item.qty * scale;
    dimLineV(ctx, sx - 18, oy, stackTop,
      `${(item.hOrig * item.qty).toFixed(item.hOrig % 1 !== 0 ? 1 : 0)} ${item.dimUnit}`,
      item.color.text + 'cc');

    // Per-piece H label at dim line if space allows
    if (item.qty > 1 && sh > 10) {
      ctx.fillStyle = item.color.text + '99';
      ctx.font = `8px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText(`×${item.qty}`, sx - 22, (stackTop + oy) / 2 + 3);
    }

    // Cargo name above stack
    ctx.fillStyle = item.color.text;
    ctx.font = `bold 10px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(item.name, sx + sw / 2, stackTop - 6);

    // L dim line (below base)
    dimLineH(ctx, sx, sx + sw, oy + 18,
      `${item.lOrig} ${item.dimUnit}`,
      item.color.text + 'bb');
  }

  // Axis labels
  ctx.fillStyle = '#94a3b8'; ctx.font = `10px ${FONT}`; ctx.textAlign = 'center';
  ctx.fillText('L →', ox + drawW + 16, oy + 4);
  ctx.save();
  ctx.translate(PAD.l - 44, PAD.t + avH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('H ↑', 0, 0);
  ctx.restore();
}

// ── Side View: each type arranged by W, stacked by H ─────────────────────────
export function drawSide(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  items: DrawItem[]
) {
  const W = canvas.width, H = canvas.height;
  setupCanvas(ctx, W, H);
  drawViewTitle(ctx, W, 'Side View', 'W × H');
  if (!items.length) return;

  const PAD = { l: 52, r: 18, t: 38, b: 44 };

  // Arrange each type by W on x axis
  let sideX = 0;
  const sideItems = items.map(item => {
    const x = sideX;
    sideX += item.wCm + GAP_CM;
    return { ...item, sideXOff: x };
  });
  const totalW = sideX - GAP_CM;
  const maxH = items.reduce((m, it) => Math.max(m, it.hCm * it.qty), 0);
  if (!totalW || !maxH) return;

  const avW = W - PAD.l - PAD.r;
  const avH = H - PAD.t - PAD.b;
  const scale = Math.min(avW / totalW, avH / maxH, 5);

  const drawW = totalW * scale;
  const ox = PAD.l + (avW - drawW) / 2;
  const oy = PAD.t + avH;

  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ox - 2, oy); ctx.lineTo(ox + drawW + 14, oy);
  ctx.moveTo(ox - 2, oy); ctx.lineTo(ox - 2, PAD.t + 4);
  ctx.stroke();

  for (const item of sideItems) {
    const sx = ox + item.sideXOff * scale;
    const sw = item.wCm * scale;
    const sh = item.hCm * scale;

    for (let q = 0; q < item.qty; q++) {
      const sy = oy - (q + 1) * sh;
      ctx.fillStyle = item.color.fill;
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = item.color.stroke;
      ctx.lineWidth = q === 0 ? 2 : 0.7;
      ctx.strokeRect(sx, sy, sw, sh);
      if (q > 0) {
        ctx.save();
        ctx.strokeStyle = item.color.stroke + '80';
        ctx.lineWidth = 0.6; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(sx, sy + sh); ctx.lineTo(sx + sw, sy + sh); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
      }
    }

    if (sh > 18) {
      ctx.fillStyle = item.color.text;
      ctx.font = `bold 9px ${FONT}`; ctx.textAlign = 'center';
      ctx.fillText(`H: ${item.hOrig}`, sx + sw / 2, oy - sh / 2 + 3);
    }

    const stackTop = oy - item.hCm * item.qty * scale;
    dimLineV(ctx, sx - 18, oy, stackTop,
      `${(item.hOrig * item.qty).toFixed(item.hOrig % 1 !== 0 ? 1 : 0)} ${item.dimUnit}`,
      item.color.text + 'cc');

    if (item.qty > 1 && sh > 10) {
      ctx.fillStyle = item.color.text + '99';
      ctx.font = `8px ${FONT}`; ctx.textAlign = 'right';
      ctx.fillText(`×${item.qty}`, sx - 22, (stackTop + oy) / 2 + 3);
    }

    ctx.fillStyle = item.color.text;
    ctx.font = `bold 10px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText(item.name, sx + sw / 2, stackTop - 6);

    dimLineH(ctx, sx, sx + sw, oy + 18,
      `${item.wOrig} ${item.dimUnit}`,
      item.color.text + 'bb');
  }

  ctx.fillStyle = '#94a3b8'; ctx.font = `10px ${FONT}`; ctx.textAlign = 'center';
  ctx.fillText('W →', ox + drawW + 16, oy + 4);
  ctx.save();
  ctx.translate(PAD.l - 44, PAD.t + avH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('H ↑', 0, 0);
  ctx.restore();
}

// ── Top View: each type arranged by L, W on y axis ───────────────────────────
export function drawTop(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  items: DrawItem[]
) {
  const W = canvas.width, H = canvas.height;
  setupCanvas(ctx, W, H);
  drawViewTitle(ctx, W, 'Top View', 'L × W');
  if (!items.length) return;

  const PAD = { l: 52, r: 18, t: 38, b: 44 };
  const totalL = items[items.length - 1].xOff + items[items.length - 1].lCm;
  const maxW = items.reduce((m, it) => Math.max(m, it.wCm), 0);
  if (!totalL || !maxW) return;

  const avW = W - PAD.l - PAD.r;
  const avH = H - PAD.t - PAD.b;
  const scale = Math.min(avW / totalL, avH / maxW, 5);

  const drawW = totalL * scale;
  const drawH = maxW * scale;
  const ox = PAD.l + (avW - drawW) / 2;
  const oy = PAD.t + (avH - drawH) / 2;

  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ox - 2, oy - 2); ctx.lineTo(ox + drawW + 14, oy - 2);
  ctx.moveTo(ox - 2, oy - 2); ctx.lineTo(ox - 2, oy + drawH + 14);
  ctx.stroke();

  for (const item of items) {
    const sx = ox + item.xOff * scale;
    const sw = item.lCm * scale;
    const sh = item.wCm * scale;

    ctx.fillStyle = item.color.fill;
    ctx.fillRect(sx, oy, sw, sh);
    ctx.strokeStyle = item.color.stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, oy, sw, sh);

    // Name + qty inside box
    ctx.fillStyle = item.color.text;
    ctx.font = `bold 10px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText(item.name, sx + sw / 2, oy + sh / 2 + 4);
    if (item.qty > 1) {
      ctx.fillStyle = '#ef4444';
      ctx.font = `bold 9px ${FONT}`;
      ctx.fillText(`×${item.qty}`, sx + sw / 2, oy + sh / 2 + 15);
    }

    // L dim line above
    dimLineH(ctx, sx, sx + sw, oy - 14,
      `${item.lOrig} ${item.dimUnit}`,
      item.color.text + 'bb');

    // W dim line on left
    dimLineV(ctx, ox - 18, oy, oy + sh,
      `${item.wOrig} ${item.dimUnit}`,
      item.color.text + 'bb');
  }

  ctx.fillStyle = '#94a3b8'; ctx.font = `10px ${FONT}`; ctx.textAlign = 'center';
  ctx.fillText('L →', ox + drawW + 16, oy - 2);
  ctx.save();
  ctx.translate(PAD.l - 44, oy + drawH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('W ↓', 0, 0);
  ctx.restore();
}

// ── Isometric (3D) View ───────────────────────────────────────────────────────
const COS30 = Math.cos(Math.PI / 6);
const SIN30 = 0.5;

function makeProj(ox: number, oy: number, scale: number) {
  return (wx: number, wy: number, wz: number) => ({
    x: ox + (wx - wz) * COS30 * scale,
    y: oy + (wx + wz) * SIN30 * scale - wy * scale,
  });
}

type ProjFn = ReturnType<typeof makeProj>;

function fillPoly(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  fill: string, stroke: string, lw = 1.5
) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
}

function isoBox(
  ctx: CanvasRenderingContext2D,
  proj: ProjFn,
  wx: number, wy: number, wz: number,
  l: number, h: number, w: number,
  color: CargoColor, lw = 1.5
) {
  // Top face
  fillPoly(ctx,
    [proj(wx, wy+h, wz), proj(wx+l, wy+h, wz), proj(wx+l, wy+h, wz+w), proj(wx, wy+h, wz+w)],
    color.top, color.stroke, lw);
  // Right face (x+l)
  fillPoly(ctx,
    [proj(wx+l, wy, wz), proj(wx+l, wy+h, wz), proj(wx+l, wy+h, wz+w), proj(wx+l, wy, wz+w)],
    color.right, color.stroke, lw);
  // Front face (z=wz)
  fillPoly(ctx,
    [proj(wx, wy, wz), proj(wx+l, wy, wz), proj(wx+l, wy+h, wz), proj(wx, wy+h, wz)],
    color.fill, color.stroke, lw);
}

export function drawIsometric(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  items: DrawItem[]
) {
  const W = canvas.width, H = canvas.height;
  setupCanvas(ctx, W, H);
  drawViewTitle(ctx, W, '3D Isometric', '');
  if (!items.length) return;

  const PAD = 56;
  const xMax = items[items.length - 1].xOff + items[items.length - 1].lCm;
  const yMax = items.reduce((m, it) => Math.max(m, it.hCm * it.qty), 0);
  const zMax = items.reduce((m, it) => Math.max(m, it.wCm), 0);

  const avW = W - 2 * PAD;
  const avH = H - 2 * PAD;
  const sW = avW / Math.max((xMax + zMax) * COS30, 1);
  const sH = avH / Math.max(yMax + (xMax + zMax) * SIN30, 1);
  const scale = Math.min(sW, sH, 5);

  const projW = (xMax + zMax) * COS30 * scale;
  const ox = (W - projW) / 2 + zMax * COS30 * scale;
  const oy = PAD + yMax * scale;
  const proj = makeProj(ox, oy, scale);

  for (const item of items) {
    // Draw each stacked piece
    for (let q = 0; q < item.qty; q++) {
      isoBox(ctx, proj,
        item.xOff, q * item.hCm, 0,
        item.lCm, item.hCm, item.wCm,
        item.color, q === 0 ? 2 : 0.9);
    }

    // Cargo name above stack
    const mid = proj(item.xOff + item.lCm / 2, item.hCm * item.qty, item.wCm / 2);
    ctx.fillStyle = item.color.text;
    ctx.font = `bold 10px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText(item.name, mid.x, mid.y - 10);
    if (item.qty > 1) {
      ctx.fillStyle = '#ef4444';
      ctx.font = `bold 9px ${FONT}`;
      ctx.fillText(`×${item.qty}`, mid.x, mid.y + 1);
    }

    // Dimension annotations on the first box of each type
    const p0 = proj(item.xOff, 0, 0);
    const pL = proj(item.xOff + item.lCm, 0, 0);
    const pW = proj(item.xOff, 0, item.wCm);
    const pH = proj(item.xOff, item.hCm, 0);

    ctx.save();
    ctx.strokeStyle = item.color.stroke + 'aa';
    ctx.lineWidth = 0.8;

    // L annotation
    ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y + 5); ctx.lineTo(pL.x, pL.y + 5); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = item.color.text;
    ctx.font = `8px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText(`L:${item.lOrig}${item.dimUnit}`, (p0.x + pL.x) / 2, (p0.y + pL.y) / 2 + 16);

    // H annotation
    ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(p0.x - 5, p0.y); ctx.lineTo(pH.x - 5, pH.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.translate(p0.x - 14, (p0.y + pH.y) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(`H:${item.hOrig}${item.dimUnit}`, 0, 0);
    ctx.restore();
    ctx.save();

    // W annotation
    ctx.strokeStyle = item.color.stroke + 'aa'; ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y + 3); ctx.lineTo(pW.x, pW.y + 3); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = item.color.text;
    ctx.font = `8px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText(`W:${item.wOrig}${item.dimUnit}`, (p0.x + pW.x) / 2 - 6, (p0.y + pW.y) / 2 + 12);
    ctx.restore();
  }
}
