export interface CargoItem {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  quantity: number;
  weight: number; // weight per piece, in the user's weight unit
}

export interface CargoResult {
  id: string;
  name: string;
  volPerPieceCm3: number;
  totalVolCm3: number;
  volWtPerPiece: number;   // in user's weight unit
  totalVolWt: number;       // in user's weight unit
  totalActualWt: number;    // in user's weight unit
  chargeableWt: number;     // in user's weight unit
  isVolumetric: boolean;
}

export interface Totals {
  totalVolCm3: number;
  totalVolWt: number;
  totalActualWt: number;
  totalChargeableWt: number;
}

// Conversion: 1 unit → cm
const DIM_TO_CM: Record<string, number> = {
  cm: 1,
  inch: 2.54,
  m: 100,
  ft: 30.48,
};

// Conversion: 1 unit → kg
const WEIGHT_TO_KG: Record<string, number> = {
  kg: 1,
  lb: 0.453592,
};

// Conversion: 1 kg → unit
const KG_TO_WEIGHT: Record<string, number> = {
  kg: 1,
  lb: 2.20462,
};

export function toCm(value: number, unit: string): number {
  return value * (DIM_TO_CM[unit] ?? 1);
}

export function toKg(value: number, unit: string): number {
  return value * (WEIGHT_TO_KG[unit] ?? 1);
}

export function fromKg(value: number, unit: string): number {
  return value * (KG_TO_WEIGHT[unit] ?? 1);
}

export function calculateCargo(
  item: CargoItem,
  dimUnit: string,
  weightUnit: string,
  divisor: number
): CargoResult {
  const lCm = toCm(item.length, dimUnit);
  const wCm = toCm(item.width, dimUnit);
  const hCm = toCm(item.height, dimUnit);

  const volPerPieceCm3 = lCm * wCm * hCm;
  const totalVolCm3 = volPerPieceCm3 * item.quantity;

  // Volumetric weight always computed in kg, then converted
  const volWtPerPieceKg = volPerPieceCm3 / divisor;
  const totalVolWtKg = totalVolCm3 / divisor;

  const volWtPerPiece = fromKg(volWtPerPieceKg, weightUnit);
  const totalVolWt = fromKg(totalVolWtKg, weightUnit);

  // Actual weight: weight-per-piece × qty (already in user's weight unit)
  const totalActualWt = item.weight * item.quantity;

  const chargeableWt = Math.max(totalVolWt, totalActualWt);
  const isVolumetric = totalVolWt > totalActualWt;

  return {
    id: item.id,
    name: item.name,
    volPerPieceCm3,
    totalVolCm3,
    volWtPerPiece,
    totalVolWt,
    totalActualWt,
    chargeableWt,
    isVolumetric,
  };
}

export function calculateAll(
  items: CargoItem[],
  dimUnit: string,
  weightUnit: string,
  divisor: number
): CargoResult[] {
  return items.map(item => calculateCargo(item, dimUnit, weightUnit, divisor));
}

export function calculateTotals(results: CargoResult[]): Totals {
  return {
    totalVolCm3: results.reduce((s, r) => s + r.totalVolCm3, 0),
    totalVolWt: results.reduce((s, r) => s + r.totalVolWt, 0),
    totalActualWt: results.reduce((s, r) => s + r.totalActualWt, 0),
    totalChargeableWt: results.reduce((s, r) => s + r.chargeableWt, 0),
  };
}
