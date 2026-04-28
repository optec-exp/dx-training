export type Category = "物流操作" | "财务";

export interface Term {
  term: string;
  full: string;
  cat: Category;
  def: string;
  example?: string;
}

export const terms: Term[] = [
  // ── 物流操作类 ──────────────────────────────────────────
  { term: "AMS",  full: "Automated Manifest System",        cat: "物流操作", def: "自动舱单系统，海运至美国须提前24小时提交舱单数据。", example: "AMS数据要在开船前24小时提交。" },
  { term: "ATD",  full: "Actual Time of Departure",         cat: "物流操作", def: "实际离港时间，与ETD对应，用于追踪实际动态。", example: "ATD比ETD晚了两天，需更新ETA。" },
  { term: "ATA",  full: "Actual Time of Arrival",           cat: "物流操作", def: "实际到港时间，货物真实抵达目的港的时间。", example: "ATA确认后即可安排清关。" },
  { term: "AWB",  full: "Air Waybill",                      cat: "物流操作", def: "航空运单，航空货运的核心单据，由航空公司或代理签发，是货物交运的凭证。", example: "请发我AWB号，我要查货物状态。" },
  { term: "BL",   full: "Bill of Lading",                   cat: "物流操作", def: "提单，海运货物的物权凭证，凭正本提单提货。", example: "正本BL三份，需寄原件给收货方。" },
  { term: "CBM",  full: "Cubic Meter",                      cat: "物流操作", def: "立方米，货物体积单位，海运计费常用。", example: "这票货共3.5 CBM，走LCL。" },
  { term: "CFS",  full: "Container Freight Station",        cat: "物流操作", def: "集装箱货运站，LCL货物的拆拼箱场所。", example: "LCL货物在CFS拼箱后出运。" },
  { term: "CI",   full: "Commercial Invoice",               cat: "物流操作", def: "商业发票，用于报关和结汇的核心单据，注明货物价值。", example: "CI金额必须与合同一致。" },
  { term: "CLP",  full: "Container Load Plan",              cat: "物流操作", def: "装箱清单/装柜计划，记录箱内货物的摆放方式和重量分布。", example: "装柜前请出具CLP给司机。" },
  { term: "CO",   full: "Certificate of Origin",            cat: "物流操作", def: "原产地证书，证明货物生产国，享受关税优惠的必要文件。", example: "欧盟客户要求Form A的CO。" },
  { term: "DGD",  full: "Dangerous Goods Declaration",      cat: "物流操作", def: "危险品申报单，危险货物托运必须填写的法定文件。", example: "没有DGD，航空公司不接收危险品。" },
  { term: "DO",   full: "Delivery Order",                   cat: "物流操作", def: "提货单/放货单，由承运人或代理签发，提货方凭此提货。", example: "换单费已付，DO已拿到。" },
  { term: "ETA",  full: "Estimated Time of Arrival",        cat: "物流操作", def: "预计到港时间，货物预计抵达目的地的时间。", example: "ETA确认后请通知收货方备好仓位。" },
  { term: "ETD",  full: "Estimated Time of Departure",      cat: "物流操作", def: "预计离港时间，船/机预计出发的时间。", example: "ETD是4月30日，客户要求5月10日前到。" },
  { term: "FCL",  full: "Full Container Load",              cat: "物流操作", def: "整箱货，货主独用一个集装箱，适合货量较大的情况。", example: "这票货够一个40HQ，走FCL。" },
  { term: "GW",   full: "Gross Weight",                     cat: "物流操作", def: "毛重，货物含包装的总重量。", example: "GW不超过25KG/件，避免超重附加费。" },
  { term: "HAZ",  full: "Hazardous Cargo",                  cat: "物流操作", def: "危险货物，按IATA或IMDG规定分类，需特殊申报和包装。", example: "锂电池属于HAZ，需DGD申报。" },
  { term: "HAWB", full: "House Air Waybill",                cat: "物流操作", def: "分运单，由货运代理商签发给实际托运人，从属于主运单。", example: "每票货都有独立的HAWB号。" },
  { term: "HBL",  full: "House Bill of Lading",             cat: "物流操作", def: "货代提单，由货运代理签发，收货方凭此向货代提货。", example: "我们开HBL给客户，MBL在货代手里。" },
  { term: "ISF",  full: "Importer Security Filing",         cat: "物流操作", def: "进口商安全申报（美国），货物进入美国前须提前24小时申报。", example: "发美国的货，记得提前做ISF。" },
  { term: "LCL",  full: "Less than Container Load",         cat: "物流操作", def: "拼箱货，多个货主共用一个集装箱，适合小批量货物。", example: "只有2CBM，走LCL拼箱比较合算。" },
  { term: "MAWB", full: "Master Air Waybill",               cat: "物流操作", def: "主运单，由承运航空公司签发，记录整批货物信息。", example: "MAWB对应整柜货，HAWB对应分单。" },
  { term: "MBL",  full: "Master Bill of Lading",            cat: "物流操作", def: "船公司主提单，货代凭此向船公司提货。", example: "MBL的托运人是我们货代公司。" },
  { term: "NW",   full: "Net Weight",                       cat: "物流操作", def: "净重，货物不含包装的实际重量。", example: "报关时需填写NW和GW。" },
  { term: "OOG",  full: "Out of Gauge",                     cat: "物流操作", def: "超限货物，超出标准集装箱尺寸的大件货物，需特殊安排。", example: "OOG货需提前与船公司确认设备。" },
  { term: "PL",   full: "Packing List",                     cat: "物流操作", def: "装箱单，详细列明货物的件数、毛净重、尺寸等信息。", example: "报关需要CI和PL。" },
  { term: "POD",  full: "Port of Destination / Proof of Delivery", cat: "物流操作", def: "目的港 或 签收回单（送达确认证明），需根据上下文区分。", example: "请提供POD，客户要确认货已签收。" },
  { term: "POL",  full: "Port of Loading",                  cat: "物流操作", def: "装货港，货物开始运输的港口。", example: "POL是上海，POD是鹿特丹。" },
  { term: "SLA",  full: "Service Level Agreement",          cat: "物流操作", def: "服务水平协议，规定运输时效、服务标准等承诺指标。", example: "按SLA要求，48小时内必须出运。" },
  { term: "THC",  full: "Terminal Handling Charge",         cat: "物流操作", def: "码头操作费，在装卸港码头发生的货物装卸及存储费用。", example: "目的港THC由收货方承担。" },
  { term: "VW",   full: "Volume Weight",                    cat: "物流操作", def: "体积重量，航空运费按实重与体积重取大值计费。计算：长×宽×高(cm)÷6000。", example: "体积大密度小的货，VW往往大于GW。" },

  // ── 财务类 ──────────────────────────────────────────────
  { term: "AP",   full: "Accounts Payable",                 cat: "财务", def: "应付账款，公司欠供应商/合作方的款项，是公司的负债。", example: "AP到期前安排付款，避免逾期。" },
  { term: "AR",   full: "Accounts Receivable",              cat: "财务", def: "应收账款，客户欠公司的款项，是公司的资产。", example: "本月AR余额增加，需跟进回款。" },
  { term: "CFR",  full: "Cost and Freight",                 cat: "财务", def: "成本加运费，卖方支付运费，但保险由买方自行安排。", example: "CFR与CIF的区别是保险责任。" },
  { term: "CIF",  full: "Cost, Insurance and Freight",      cat: "财务", def: "成本加保险费加运费，卖方负责货物运至目的港的运费和保险费。", example: "CIF鹿特丹报价，包含海运和保险。" },
  { term: "CNY",  full: "Chinese Yuan / Renminbi",          cat: "财务", def: "人民币，中国法定货币，国内结算使用。", example: "国内代理费用以CNY结算。" },
  { term: "COGS", full: "Cost of Goods Sold",               cat: "财务", def: "销售成本，直接与货物销售相关的成本，包括采购成本和运费等。", example: "COGS上涨导致本月毛利下降。" },
  { term: "CR",   full: "Credit Note",                      cat: "财务", def: "贷项通知单，用于冲减已开发票金额，如退货或折扣补偿。", example: "货损部分开CR抵扣下期款项。" },
  { term: "DAP",  full: "Delivered at Place",               cat: "财务", def: "目的地交货，卖方负责将货物运到指定目的地，不含进口清关费用。", example: "DAP客户仓库，我们负责到门。" },
  { term: "DDP",  full: "Delivered Duty Paid",              cat: "财务", def: "完税后交货，卖方承担包括进口关税在内的全部费用，责任最大。", example: "DDP条款对卖方风险最高。" },
  { term: "DR",   full: "Debit Note",                       cat: "财务", def: "借项通知单，要求对方补充付款的通知，用于追加费用。", example: "目的港产生额外费用，开DR给客户。" },
  { term: "DSO",  full: "Days Sales Outstanding",           cat: "财务", def: "平均回款天数，衡量应收账款回收效率的指标，越低越好。", example: "DSO超过90天，需加强催收。" },
  { term: "EXW",  full: "Ex Works",                         cat: "财务", def: "工厂交货，卖方仅需在工厂备好货物，后续所有费用由买方承担。", example: "EXW工厂价，买方自己安排拖车和清关。" },
  { term: "FOB",  full: "Free On Board",                    cat: "财务", def: "船上交货，卖方负责将货物装上指定船只，之后风险转移给买方。", example: "报价FOB上海，不含海运费和保险。" },
  { term: "FX",   full: "Foreign Exchange",                 cat: "财务", def: "外汇，不同货币之间的兑换，汇率波动影响结算金额。", example: "FX风险需提前锁汇对冲。" },
  { term: "GP",   full: "Gross Profit",                     cat: "财务", def: "毛利润，收入减去直接成本后的利润，未扣除费用。", example: "这票货GP率只有8%，低于目标。" },
  { term: "KPI",  full: "Key Performance Indicator",        cat: "财务", def: "关键绩效指标，用于衡量业务目标完成情况的量化指标。", example: "本季度KPI：回款率95%以上。" },
  { term: "LC",   full: "Letter of Credit",                 cat: "财务", def: "信用证，银行开立的付款保证文件，是国际贸易中安全的结算方式。", example: "新客户建议走LC结算，降低风险。" },
  { term: "NET30",full: "Net 30 Days",                      cat: "财务", def: "净30天账期，发票开出后30天内付款。类似还有NET60、NET90。", example: "合同约定NET30，发票日期是4月1日，则4月30日付款。" },
  { term: "NP",   full: "Net Profit",                       cat: "财务", def: "净利润，扣除所有成本和费用后的最终利润。", example: "NP是公司最终盈利能力的体现。" },
  { term: "OA",   full: "Open Account",                     cat: "财务", def: "赊销，先发货后收款，对卖方风险较高，多用于长期合作客户。", example: "老客户给OA 30天账期。" },
  { term: "P&L",  full: "Profit and Loss Statement",        cat: "财务", def: "损益表，反映公司一定期间内收入、成本和利润的财务报表。", example: "月底出P&L给管理层审阅。" },
  { term: "ROI",  full: "Return on Investment",             cat: "财务", def: "投资回报率，衡量投入与产出比例的财务指标。", example: "这个项目ROI预计18个月回本。" },
  { term: "TT",   full: "Telegraphic Transfer",             cat: "财务", def: "电汇，通过银行电报或电子方式直接汇款，是最常用的结算方式。", example: "收到TT水单后安排发货。" },
  { term: "USD",  full: "US Dollar",                        cat: "财务", def: "美元，国际货运结算最常用货币。", example: "运费报价以USD计。" },
  { term: "VAT",  full: "Value Added Tax",                  cat: "财务", def: "增值税，中国增值税率一般为13%（货物）或6%（服务）。", example: "开专票的VAT可以抵扣。" },
];
