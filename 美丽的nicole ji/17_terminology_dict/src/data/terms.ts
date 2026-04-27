export type Category = '单证类' | '重量计费' | '时间航班' | '贸易术语';

export interface Term {
  id: number;
  abbr: string;
  en: string;
  zh: string;
  category: Category;
  note?: string;
}

export const CATEGORIES: Category[] = ['单证类', '重量计费', '时间航班', '贸易术语'];

export const terms: Term[] = [
  // ── 单证类 ──────────────────────────────────────────
  { id: 1,  abbr: 'AWB',              en: 'Air Waybill',                       zh: '空运单',               category: '单证类' },
  { id: 2,  abbr: 'MAWB',             en: 'Master Air Waybill',                zh: '主单（主空运单）',      category: '单证类' },
  { id: 3,  abbr: 'HAWB',             en: 'House Air Waybill',                 zh: '分单（分空运单）',      category: '单证类' },
  { id: 4,  abbr: 'Shipper',          en: 'Shipper',                           zh: '发货人',               category: '单证类' },
  { id: 5,  abbr: 'Consignee',        en: 'Consignee',                         zh: '收货人',               category: '单证类' },
  { id: 6,  abbr: 'Notify Party',     en: 'Notify Party',                      zh: '通知人',               category: '单证类' },
  { id: 7,  abbr: 'INV',              en: 'Invoice',                           zh: '商业发票',             category: '单证类' },
  { id: 8,  abbr: 'PL',               en: 'Packing List',                      zh: '装箱单',               category: '单证类' },
  { id: 9,  abbr: 'CO',               en: 'Certificate of Origin',             zh: '原产地证',             category: '单证类' },
  { id: 10, abbr: 'MSDS',             en: 'Material Safety Data Sheet',        zh: '化学品安全说明书',      category: '单证类' },
  { id: 11, abbr: 'CIQ',              en: 'China Inspection and Quarantine',   zh: '商检',                 category: '单证类' },
  { id: 12, abbr: 'S/I',              en: 'Shipping Instruction',              zh: '订舱单',               category: '单证类' },
  { id: 13, abbr: 'Booking',          en: 'Booking',                           zh: '订舱',                 category: '单证类' },
  { id: 14, abbr: 'Space',            en: 'Space',                             zh: '舱位',                 category: '单证类' },
  { id: 15, abbr: 'Booking Confirmation', en: 'Booking Confirmation',          zh: '订舱确认',             category: '单证类' },
  { id: 16, abbr: 'F/C',              en: 'Freighter',                         zh: '全货机',               category: '单证类' },
  { id: 17, abbr: 'PAX',              en: 'Passenger Flight',                  zh: '客机腹舱',             category: '单证类' },
  { id: 18, abbr: 'Charter',          en: 'Charter',                           zh: '包机',                 category: '单证类' },
  { id: 19, abbr: 'Cut-off Time',     en: 'Cut-off Time',                      zh: '截货时间',             category: '单证类' },
  { id: 20, abbr: 'HS Code',          en: 'Harmonized System Code',            zh: '海关编码',             category: '单证类' },
  { id: 21, abbr: 'Manifest',         en: 'Manifest',                          zh: '舱单',                 category: '单证类' },
  { id: 22, abbr: 'D/O',              en: 'Delivery Order',                    zh: '提货单',               category: '单证类' },
  { id: 23, abbr: 'POD',              en: 'Proof of Delivery',                 zh: '签收证明',             category: '单证类' },

  // ── 重量计费 ────────────────────────────────────────
  { id: 24, abbr: 'Inquiry',          en: 'Inquiry',                           zh: '询价',                 category: '重量计费' },
  { id: 25, abbr: 'Quotation',        en: 'Quotation',                         zh: '报价',                 category: '重量计费' },
  { id: 26, abbr: 'Rate Sheet',       en: 'Rate Sheet',                        zh: '运价表',               category: '重量计费' },
  { id: 27, abbr: 'All-in Rate',      en: 'All-in Rate',                       zh: '全包价',               category: '重量计费' },
  { id: 28, abbr: 'Validity',         en: 'Validity',                          zh: '价格有效期',           category: '重量计费' },
  { id: 29, abbr: 'G.W.',             en: 'Gross Weight',                      zh: '毛重',                 category: '重量计费' },
  { id: 30, abbr: 'N.W.',             en: 'Net Weight',                        zh: '净重',                 category: '重量计费' },
  { id: 31, abbr: 'V.W.',             en: 'Volumetric Weight',                 zh: '体积重',               category: '重量计费', note: '长×宽×高（cm）÷ 6000' },
  { id: 32, abbr: 'C.W.',             en: 'Chargeable Weight',                 zh: '计费重量',             category: '重量计费', note: 'G.W. 与 V.W. 取较大值' },
  { id: 33, abbr: 'MIN',              en: 'Minimum Charge',                    zh: '最低收费',             category: '重量计费' },

  // ── 时间航班 ────────────────────────────────────────
  { id: 34, abbr: 'ETD',              en: 'Estimated Time of Departure',       zh: '预计起飞时间',         category: '时间航班' },
  { id: 35, abbr: 'ETA',              en: 'Estimated Time of Arrival',         zh: '预计到达时间',         category: '时间航班' },
  { id: 36, abbr: 'ATD',              en: 'Actual Time of Departure',          zh: '实际起飞时间',         category: '时间航班' },
  { id: 37, abbr: 'ATA',              en: 'Actual Time of Arrival',            zh: '实际到达时间',         category: '时间航班' },
  { id: 38, abbr: 'STD',              en: 'Scheduled Time of Departure',       zh: '计划起飞时间',         category: '时间航班' },
  { id: 39, abbr: 'STA',              en: 'Scheduled Time of Arrival',         zh: '计划到达时间',         category: '时间航班' },
  { id: 40, abbr: 'T/T',              en: 'Transit Time',                      zh: '运输时效',             category: '时间航班' },
  { id: 41, abbr: 'Offload',          en: 'Offload',                           zh: '拉货（货物被卸下）',   category: '时间航班' },
  { id: 42, abbr: 'Delay',            en: 'Delay',                             zh: '延误',                 category: '时间航班' },
  { id: 43, abbr: 'Flight No.',       en: 'Flight Number',                     zh: '航班号',               category: '时间航班' },

  // ── 贸易术语（Incoterms 2020）───────────────────────
  { id: 44, abbr: 'EXW',              en: 'Ex Works',                          zh: '工厂交货',             category: '贸易术语', note: 'E组 · 卖方责任最小' },
  { id: 45, abbr: 'FCA',              en: 'Free Carrier',                      zh: '货交承运人',           category: '贸易术语', note: 'F组' },
  { id: 46, abbr: 'FAS',              en: 'Free Alongside Ship',               zh: '船边交货',             category: '贸易术语', note: 'F组 · 仅海运' },
  { id: 47, abbr: 'FOB',              en: 'Free On Board',                     zh: '船上交货',             category: '贸易术语', note: 'F组 · 仅海运' },
  { id: 48, abbr: 'CFR',              en: 'Cost and Freight',                  zh: '成本加运费',           category: '贸易术语', note: 'C组 · 仅海运' },
  { id: 49, abbr: 'CIF',              en: 'Cost, Insurance and Freight',       zh: '成本保险费加运费',     category: '贸易术语', note: 'C组 · 仅海运' },
  { id: 50, abbr: 'CPT',              en: 'Carriage Paid To',                  zh: '运费付至',             category: '贸易术语', note: 'C组' },
  { id: 51, abbr: 'CIP',              en: 'Carriage and Insurance Paid To',    zh: '运费保险费付至',       category: '贸易术语', note: 'C组' },
  { id: 52, abbr: 'DAP',              en: 'Delivered at Place',                zh: '目的地交货',           category: '贸易术语', note: 'D组 · 卖方责任最大' },
  { id: 53, abbr: 'DPU',              en: 'Delivered at Place Unloaded',       zh: '目的地卸货交货',       category: '贸易术语', note: 'D组' },
  { id: 54, abbr: 'DDP',              en: 'Delivered Duty Paid',               zh: '完税后交货',           category: '贸易术语', note: 'D组 · 卖方承担全部费用与风险' },
];
