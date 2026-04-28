export type Language = 'zh' | 'en' | 'ja';

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

export interface Translation {
  title: string;
  subtitle: string;
  // Settings
  dimensionUnit: string;
  weightUnit: string;
  freightMode: string;
  divisorLabel: string;
  airBtn: string;
  expressBtn: string;
  customBtn: string;
  airFull: string;
  expressFull: string;
  // Form
  addCargo: string;
  cargoName: string;
  namePlaceholder: string;
  lengthLabel: string;
  widthLabel: string;
  heightLabel: string;
  quantityLabel: string;
  weightPerPiece: string;
  addButton: string;
  // Table
  typeCol: string;
  dimsCol: string;
  qtyCol: string;
  volPieceCol: string;
  volWtPieceCol: string;
  totalVolWtCol: string;
  actualWtCol: string;
  chargeableCol: string;
  basisCol: string;
  byVolume: string;
  byActual: string;
  removeBtn: string;
  noItems: string;
  addFirst: string;
  // Summary
  summaryTitle: string;
  totalVolumeLabel: string;
  totalVolWtLabel: string;
  totalActualWtLabel: string;
  totalChargeableLabel: string;
  // Diagram
  diagramTitle: string;
  isometricLabel: string;
  frontViewLabel: string;
  sideViewLabel: string;
  topViewLabel: string;
  diagramNote: string;
  // Misc
  piecesUnit: string;
  cbmUnit: string;
}

export const translations: Record<Language, Translation> = {
  zh: {
    title: '体积重量计算工具',
    subtitle: '货运代理专用 · 支持多规格货物 · 实时对比体积重量与实际重量',
    dimensionUnit: '尺寸单位',
    weightUnit: '重量单位',
    freightMode: '运输方式',
    divisorLabel: '体积重量系数',
    airBtn: '航空 ÷6000',
    expressBtn: '快递 ÷5000',
    customBtn: '自定义',
    airFull: '航空货运（体积重量系数 6000 cm³/kg）',
    expressFull: '快递件（体积重量系数 5000 cm³/kg）',
    addCargo: '添加货物',
    cargoName: '货物名称',
    namePlaceholder: '例：外箱A',
    lengthLabel: '长 (L)',
    widthLabel: '宽 (W)',
    heightLabel: '高 (H)',
    quantityLabel: '件数',
    weightPerPiece: '单件重量',
    addButton: '添加货物',
    typeCol: '货物',
    dimsCol: '尺寸 L×W×H',
    qtyCol: '件数',
    volPieceCol: '单件体积',
    volWtPieceCol: '单件体积重',
    totalVolWtCol: '总体积重',
    actualWtCol: '总实重',
    chargeableCol: '计费重量',
    basisCol: '计费依据',
    byVolume: '按体积',
    byActual: '按重量',
    removeBtn: '删除',
    noItems: '暂无货物',
    addFirst: '请在左侧填写货物信息并点击添加',
    summaryTitle: '汇总',
    totalVolumeLabel: '总体积',
    totalVolWtLabel: '总体积重量',
    totalActualWtLabel: '总实际重量',
    totalChargeableLabel: '总计费重量',
    diagramTitle: '三视图 & 立体示意图',
    isometricLabel: '立体示意图',
    frontViewLabel: '正视图 (L × H)',
    sideViewLabel: '侧视图 (W × H)',
    topViewLabel: '俯视图 (L × W)',
    diagramNote:
      '图中每种颜色代表一种货物类型。实线框为单件尺寸，堆叠后的整体形态及件数标注在图中。所有尺寸已换算为 cm 显示。',
    piecesUnit: '件',
    cbmUnit: 'CBM',
  },
  en: {
    title: 'Volume Weight Calculator',
    subtitle: 'Freight Forwarder Tool · Multi-SKU · Real-time Volumetric vs. Actual Weight',
    dimensionUnit: 'Dimension Unit',
    weightUnit: 'Weight Unit',
    freightMode: 'Freight Mode',
    divisorLabel: 'Volumetric Divisor',
    airBtn: 'Air ÷6000',
    expressBtn: 'Express ÷5000',
    customBtn: 'Custom',
    airFull: 'Air Freight (volumetric divisor 6000 cm³/kg)',
    expressFull: 'Express Courier (volumetric divisor 5000 cm³/kg)',
    addCargo: 'Add Cargo',
    cargoName: 'Cargo Name',
    namePlaceholder: 'e.g. Carton A',
    lengthLabel: 'Length (L)',
    widthLabel: 'Width (W)',
    heightLabel: 'Height (H)',
    quantityLabel: 'Quantity',
    weightPerPiece: 'Weight / Piece',
    addButton: 'Add Cargo',
    typeCol: 'Cargo',
    dimsCol: 'Dimensions L×W×H',
    qtyCol: 'Qty',
    volPieceCol: 'Vol/Piece',
    volWtPieceCol: 'Vol.Wt/Piece',
    totalVolWtCol: 'Total Vol.Wt',
    actualWtCol: 'Actual Wt',
    chargeableCol: 'Chargeable Wt',
    basisCol: 'Basis',
    byVolume: 'Volumetric',
    byActual: 'Actual',
    removeBtn: 'Remove',
    noItems: 'No cargo added',
    addFirst: 'Fill in the cargo details on the left and click Add',
    summaryTitle: 'Summary',
    totalVolumeLabel: 'Total Volume',
    totalVolWtLabel: 'Total Vol. Weight',
    totalActualWtLabel: 'Total Actual Weight',
    totalChargeableLabel: 'Total Chargeable Weight',
    diagramTitle: 'Three-View & 3D Diagram',
    isometricLabel: '3D Isometric',
    frontViewLabel: 'Front View (L × H)',
    sideViewLabel: 'Side View (W × H)',
    topViewLabel: 'Top View (L × W)',
    diagramNote:
      'Each color represents one cargo type. Solid outlines show individual item dimensions; stacked height and quantity are annotated. All dimensions shown in cm.',
    piecesUnit: 'pcs',
    cbmUnit: 'CBM',
  },
  ja: {
    title: '容積重量計算ツール',
    subtitle: '貨物フォワーダー向け · 複数規格対応 · 体積重量と実重量をリアルタイム比較',
    dimensionUnit: '寸法単位',
    weightUnit: '重量単位',
    freightMode: '輸送モード',
    divisorLabel: '容積重量係数',
    airBtn: '航空 ÷6000',
    expressBtn: '宅配 ÷5000',
    customBtn: 'カスタム',
    airFull: '航空貨物（容積重量係数 6000 cm³/kg）',
    expressFull: '宅配便（容積重量係数 5000 cm³/kg）',
    addCargo: '貨物を追加',
    cargoName: '貨物名',
    namePlaceholder: '例：カートンA',
    lengthLabel: '長さ (L)',
    widthLabel: '幅 (W)',
    heightLabel: '高さ (H)',
    quantityLabel: '数量',
    weightPerPiece: '1個あたりの重量',
    addButton: '追加する',
    typeCol: '貨物',
    dimsCol: '寸法 L×W×H',
    qtyCol: '数量',
    volPieceCol: '1個の体積',
    volWtPieceCol: '1個の体積重量',
    totalVolWtCol: '合計体積重量',
    actualWtCol: '合計実重量',
    chargeableCol: '請求対象重量',
    basisCol: '課金根拠',
    byVolume: '体積',
    byActual: '実重量',
    removeBtn: '削除',
    noItems: '貨物なし',
    addFirst: '左側のフォームに貨物情報を入力して追加してください',
    summaryTitle: '合計',
    totalVolumeLabel: '総体積',
    totalVolWtLabel: '総体積重量',
    totalActualWtLabel: '総実重量',
    totalChargeableLabel: '総請求対象重量',
    diagramTitle: '三面図 & 等角投影図',
    isometricLabel: '等角投影図',
    frontViewLabel: '正面図 (L × H)',
    sideViewLabel: '側面図 (W × H)',
    topViewLabel: '平面図 (L × W)',
    diagramNote:
      '色ごとに貨物の種類を示します。実線枠は個別の寸法、積み重ね後の合計高さと数量が図示されています。寸法はすべてcmに換算して表示。',
    piecesUnit: '個',
    cbmUnit: 'CBM',
  },
};
