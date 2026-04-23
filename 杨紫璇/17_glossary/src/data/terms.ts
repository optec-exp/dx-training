export type Category = '运输' | '通关' | '文件' | '计费' | '特殊货物' | '基础';

export interface Term {
  id: number;
  abbr: string;
  en: string;
  ja: string;
  zh: string;
  desc_zh: string;
  desc_ja: string;
  category: Category;
}

export const TERMS: Term[] = [
  // 运输
  { id: 1,  abbr: 'AWB',        en: 'Air Waybill',               ja: '航空運送状',               zh: '航空运单',         desc_zh: '航空运输中的货物合同凭证，由航空公司或代理签发，是货物运输的重要单据。',                           desc_ja: '航空貨物の運送契約を証明する書類。航空会社または代理店が発行する。',               category: '运输' },
  { id: 2,  abbr: 'HAWB',       en: 'House Air Waybill',         ja: 'ハウスエアウェイビル',     zh: '分运单',           desc_zh: '货运代理公司对托运人签发的运单，属于主运单下的子运单。',                                               desc_ja: 'フォワーダーが荷主に対して発行する運送状。MAWBの下位に位置する。',               category: '运输' },
  { id: 3,  abbr: 'MAWB',       en: 'Master Air Waybill',        ja: 'マスターエアウェイビル',   zh: '主运单',           desc_zh: '航空公司对货运代理签发的运单，一票MAWB下可包含多票HAWB。',                                              desc_ja: '航空会社がフォワーダーに発行する運送状。複数のHAWBをまとめる。',                 category: '运输' },
  { id: 4,  abbr: 'NFO',        en: 'Next Flight Out',           ja: 'ネクストフライトアウト',   zh: '最速航班',         desc_zh: '将货物安排在下一班可用航班上发出，适用于对时效要求极高的紧急货物。',                                     desc_ja: '次の利用可能な便に貨物を搭載するサービス。緊急貨物に対応。',                     category: '运输' },
  { id: 5,  abbr: 'OBC',        en: 'On Board Courier',          ja: 'オンボードクーリエ',       zh: '随身携带运输',     desc_zh: '专属信使以手提行李方式随身携带货物，提供最高速度与安全级别的运输服务。',                                 desc_ja: '専属クーリエが手荷物として貨物を随行する最速・最高安全輸送サービス。',           category: '运输' },
  { id: 6,  abbr: 'AOG',        en: 'Aircraft on Ground',        ja: 'アオジー',                 zh: '飞机停飞',         desc_zh: '航空器因故障停场无法运营，需要紧急调配航材的情况，属于最高优先级紧急物流。',                             desc_ja: '航空機が故障により運航不能な状態。航材の緊急調達が必要となる最優先物流。',       category: '运输' },
  { id: 7,  abbr: 'ETA',        en: 'Estimated Time of Arrival', ja: '到着予定時刻',             zh: '预计到达时间',     desc_zh: '货物或运输工具预计抵达目的地的时间。',                                                                   desc_ja: '貨物または輸送機関が目的地に到着する予定時刻。',                                 category: '运输' },
  { id: 8,  abbr: 'ETD',        en: 'Estimated Time of Departure',ja: '出発予定時刻',            zh: '预计出发时间',     desc_zh: '货物或运输工具预计从出发地离开的时间。',                                                                 desc_ja: '貨物または輸送機関が出発地を出発する予定時刻。',                                 category: '运输' },
  { id: 9,  abbr: 'ULD',        en: 'Unit Load Device',          ja: 'ユニットロードデバイス',   zh: '集装器',           desc_zh: '航空货运中用于装载货物的标准化容器或托板，提高装卸效率。',                                             desc_ja: '航空貨物の搭載効率を高めるための標準化されたコンテナまたはパレット。',           category: '运输' },
  // 通关
  { id: 10, abbr: 'DDP',        en: 'Delivered Duty Paid',       ja: '関税込み持込渡し',         zh: '完税后交货',       desc_zh: '卖方承担运至目的地的所有费用及进口关税，货物交付买方前全部责任由卖方承担。',                             desc_ja: '売主が輸送費と輸入関税を全て負担し、目的地で買主に引き渡す条件。',               category: '通关' },
  { id: 11, abbr: 'EXW',        en: 'Ex Works',                  ja: '工場渡し',                 zh: '工厂交货',         desc_zh: '卖方只需在其所在地将货物备好，买方负责所有后续运输及清关事宜。',                                       desc_ja: '売主は自社施設で貨物を用意するだけで、以降の輸送・通関は買主負担。',             category: '通关' },
  { id: 12, abbr: 'FOB',        en: 'Free on Board',             ja: '本船渡し',                 zh: '离岸价',           desc_zh: '货物装上出口港船舶后，风险由买方承担，常见于海运贸易术语。',                                           desc_ja: '輸出港で本船に積み込まれた後のリスクは買主負担。海上輸送の貿易条件。',           category: '通关' },
  { id: 13, abbr: 'CIF',        en: 'Cost Insurance Freight',    ja: '運賃保険料込み',           zh: '成本加保险费加运费', desc_zh: '卖方负责支付运费和保险费至目的港，货物装船后风险转移至买方。',                                        desc_ja: '売主が目的港までの運賃と保険料を負担。積載後のリスクは買主に移転。',             category: '通关' },
  { id: 14, abbr: 'ISF',        en: 'Importer Security Filing',  ja: 'インポーターセキュリティファイリング', zh: '进口商安全申报', desc_zh: '美国进口货物须在装船前向美国海关提交的安全申报，又称"10+2申报"。',                             desc_ja: '米国向け輸入貨物の船積み前に提出が必要なセキュリティ申告（10+2申告）。',         category: '通关' },
  { id: 15, abbr: 'C/O',        en: 'Certificate of Origin',     ja: '原産地証明書',             zh: '原产地证明',       desc_zh: '证明货物生产或制造地的官方文件，用于享受优惠关税或满足进口要求。',                                     desc_ja: '貨物の生産・製造地を証明する公的書類。特恵関税適用や輸入要件充足に使用。',     category: '通关' },
  { id: 16, abbr: 'ATA Carnet', en: 'ATA Carnet',                ja: 'ATAカルネ',                zh: 'ATA单证册',        desc_zh: '国际通关文件，允许货物暂时免税进出多个国家，常用于展会样品和专业设备。',                               desc_ja: '複数国への一時輸入を免税で可能にする国際通関書類。展示品・専門機材に利用。',     category: '通关' },
  // 文件
  { id: 17, abbr: 'POD',        en: 'Proof of Delivery',         ja: '配達証明',                 zh: '交货证明',         desc_zh: '收货人签署确认收到货物的文件，是完成货物交付的重要凭证。',                                             desc_ja: '受取人が貨物受領を確認・署名した書類。配送完了の証拠となる。',                   category: '文件' },
  { id: 18, abbr: 'B/L',        en: 'Bill of Lading',            ja: '船荷証券',                 zh: '提单',             desc_zh: '海运中由船公司签发的货物运输合同凭证，兼具物权凭证功能。',                                             desc_ja: '船会社が発行する海上運送の契約書類であり、貨物の権利証券でもある。',             category: '文件' },
  { id: 19, abbr: 'CASS',       en: 'Cargo Accounts Settlement Systems', ja: 'キャス',           zh: '货运账单结算系统', desc_zh: 'IATA管理的航空货运账单自动结算系统，简化货代与航空公司间的财务往来。',                                   desc_ja: 'IATAが管理する航空貨物の自動決済システム。代理店と航空会社間の精算を簡素化。', category: '文件' },
  { id: 20, abbr: 'MSD',        en: 'Material Safety Data Sheet',ja: '安全データシート',         zh: '物质安全数据表',   desc_zh: '描述化学品危险特性及安全处理方法的文件，危险品运输必备。',                                             desc_ja: '化学物質の危険性と安全な取り扱い方法を記載した書類。危険品輸送に必須。',         category: '文件' },
  // 计费
  { id: 21, abbr: 'FSC',        en: 'Fuel Surcharge',            ja: '燃油サーチャージ',         zh: '燃油附加费',       desc_zh: '因航空燃油价格波动而向托运人收取的附加费用，随油价浮动调整。',                                         desc_ja: '航空燃料価格の変動に応じて荷主に請求される付加料金。油価に連動して変動。',       category: '计费' },
  { id: 22, abbr: 'SSC',        en: 'Security Surcharge',        ja: 'セキュリティサーチャージ', zh: '安全附加费',       desc_zh: '为覆盖航空安全检查费用而收取的附加费，适用于所有航空货运。',                                           desc_ja: '航空セキュリティ検査費用をカバーするための附加料金。全航空貨物に適用。',         category: '计费' },
  { id: 23, abbr: 'VW',         en: 'Volumetric Weight',         ja: '容積重量',                 zh: '体积重量',         desc_zh: '按货物体积换算的重量，计算公式为：长×宽×高（cm）÷6000，与实际重量取大者计费。',                       desc_ja: '貨物の体積から換算した重量。長×幅×高(cm)÷6000で計算。実重量と比較し大きい方で課金。', category: '计费' },
  { id: 24, abbr: 'CW',         en: 'Chargeable Weight',         ja: '課金重量',                 zh: '计费重量',         desc_zh: '实际重量与体积重量中较大的一个，作为计算运费的基准重量。',                                             desc_ja: '実重量と容積重量のうち大きい方。運賃計算の基準となる重量。',                     category: '计费' },
  { id: 25, abbr: 'CBM',        en: 'Cubic Meter',               ja: '立方メートル',             zh: '立方米',           desc_zh: '货物体积计量单位，1 CBM = 1m × 1m × 1m，常用于计算体积重量和仓储费用。',                              desc_ja: '貨物の体積単位。1 CBM = 1m × 1m × 1m。容積重量や保管料の計算に使用。',         category: '计费' },
  { id: 26, abbr: 'T/T',        en: 'Telegraphic Transfer',      ja: '電信送金',                 zh: '电汇',             desc_zh: '通过银行电子系统进行的国际资金转账，是国际贸易中常见的付款方式。',                                     desc_ja: '銀行の電子システムを通じた国際送金。貿易決済によく使われる支払い方法。',         category: '计费' },
  // 特殊货物
  { id: 27, abbr: 'DGR',        en: 'Dangerous Goods Regulations',ja: '危険物規則書',            zh: '危险品规则',       desc_zh: 'IATA制定的航空危险品运输规则，对危险品的分类、包装、标记及申报有严格规定。',                             desc_ja: 'IATAが定める航空危険物輸送規則。分類・包装・表示・申告に関する厳格な規定。',     category: '特殊货物' },
  { id: 28, abbr: 'GDP',        en: 'Good Distribution Practice',ja: 'GDP（適正流通基準）',      zh: '药品经营质量管理规范', desc_zh: '医药品流通领域的质量管理规范，确保药品从生产到终端用户全程品质可控。',                                  desc_ja: '医薬品の流通における品質管理基準。製造から最終ユーザーまでの品質を確保する。', category: '特殊货物' },
  { id: 29, abbr: 'GMP',        en: 'Good Manufacturing Practice',ja: 'GMP（適正製造基準）',     zh: '药品生产质量管理规范', desc_zh: '药品生产的质量管理规范，确保产品的一致性和安全性，是医药物流合规的基础。',                              desc_ja: '医薬品製造における品質管理基準。製品の均一性と安全性を確保する規範。',           category: '特殊货物' },
  { id: 30, abbr: 'COO',        en: 'Chain of Custody',          ja: 'チェーンオブカストディ',   zh: '监管链',           desc_zh: '记录货物从起点到终点全程保管责任转移的文件链，医药品和法证样品尤为重要。',                               desc_ja: '貨物の保管責任の移転を起点から終点まで記録する書類の連鎖。医薬品・法証に重要。', category: '特殊货物' },
  // 基础
  { id: 31, abbr: 'IATA',       en: 'International Air Transport Association', ja: '国際航空運送協会', zh: '国际航空运输协会', desc_zh: '全球航空运输行业的国际组织，制定行业标准和规则，包括危险品、货运单证等规范。',                          desc_ja: '航空輸送業界の国際団体。危険物や貨物書類などの業界標準・規則を策定。',           category: '基础' },
  { id: 32, abbr: 'SLA',        en: 'Service Level Agreement',   ja: 'サービスレベル協定',       zh: '服务水平协议',     desc_zh: '服务提供商与客户之间关于服务质量标准的正式协议，规定响应时间、完成率等指标。',                           desc_ja: 'サービス提供者と顧客間の品質基準に関する正式な合意。応答時間や達成率を規定。', category: '基础' },
  { id: 33, abbr: 'T&T',        en: 'Track and Trace',           ja: '追跡システム',             zh: '货物追踪',         desc_zh: '对货物运输全程进行实时追踪的系统，提供货物位置和状态的可视化信息。',                                     desc_ja: '貨物の輸送全体をリアルタイムで追跡するシステム。位置・状態を可視化。',           category: '基础' },
  { id: 34, abbr: 'FCL',        en: 'Full Container Load',       ja: 'フルコンテナ',             zh: '整柜',             desc_zh: '货物独占一个完整集装箱，适合货量较大的运输需求。',                                                       desc_ja: '1つのコンテナを独占する輸送形態。貨物量が多い場合に適用される。',                 category: '基础' },
  { id: 35, abbr: 'LCL',        en: 'Less than Container Load',  ja: 'バラ積み',                 zh: '拼箱',             desc_zh: '货物与其他托运人的货物共用一个集装箱，适合货量较小的运输需求。',                                       desc_ja: '他の荷主と1つのコンテナをシェアする輸送形態。少量貨物に適用される。',             category: '基础' },
];

export const CATEGORIES: Category[] = ['运输', '通关', '文件', '计费', '特殊货物', '基础'];
