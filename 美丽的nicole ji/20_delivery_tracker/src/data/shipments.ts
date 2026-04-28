export interface Shipment {
  id:     number;
  awb:    string;
  origin: string;
  dest:   string;
  etd:    string;   // YYYY-MM-DD
  eta:    string;   // YYYY-MM-DD
  cargo:  string;
  cw:     number;   // Chargeable Weight (kg)
  note?:  string;
}

// 基准日期：2026-04-28（演示用）
export const SHIPMENTS: Shipment[] = [
  { id: 1, awb: 'CA 123-45678901', origin: 'PVG', dest: 'NRT', etd: '2026-04-28', eta: '2026-04-29', cargo: '精密機器',       cw: 125.0, note: '温度管理要 (15–25℃)' },
  { id: 2, awb: 'NH 202-98765432', origin: 'HND', dest: 'ICN', etd: '2026-04-28', eta: '2026-04-28', cargo: '医薬品サンプル', cw:  22.5, note: 'MSDS 添付要' },
  { id: 3, awb: 'CX 160-55443322', origin: 'HKG', dest: 'NRT', etd: '2026-04-29', eta: '2026-04-30', cargo: '電子部品',       cw: 380.0 },
  { id: 4, awb: 'SQ 618-77889910', origin: 'SIN', dest: 'KIX', etd: '2026-04-30', eta: '2026-04-30', cargo: 'アパレル雑貨',   cw: 215.5 },
  { id: 5, awb: 'MH 132-33221144', origin: 'KUL', dest: 'NGO', etd: '2026-05-01', eta: '2026-05-01', cargo: '工業部品',       cw: 540.0 },
  { id: 6, awb: 'EK 180-44556677', origin: 'DXB', dest: 'NRT', etd: '2026-05-02', eta: '2026-05-03', cargo: '化粧品',         cw:  88.0 },
  { id: 7, awb: 'OZ 214-88990011', origin: 'ICN', dest: 'SYD', etd: '2026-05-05', eta: '2026-05-06', cargo: '食料品',         cw: 162.0, note: '検疫証明書要' },
  { id: 8, awb: 'JL 061-22334455', origin: 'NRT', dest: 'LAX', etd: '2026-05-08', eta: '2026-05-08', cargo: '自動車部品',     cw: 750.0 },
];
