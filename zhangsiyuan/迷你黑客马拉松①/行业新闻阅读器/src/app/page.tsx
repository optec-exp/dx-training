'use client'
import { useState, useMemo } from 'react'

type Lang = 'zh' | 'en' | 'ja'
const LANGS = [{ code: 'zh' as Lang, label: '中文' }, { code: 'en' as Lang, label: 'EN' }, { code: 'ja' as Lang, label: '日本語' }]

type Cat = 'air' | 'sea' | 'customs' | 'reg' | 'market'

interface Article {
  id: string
  cat: Cat
  title: Record<Lang, string>
  summary: Record<Lang, string>
  body: Record<Lang, string>
  source: string
  date: string
}

const CAT_INFO: { id: Cat; label: Record<Lang, string>; color: string; text: string }[] = [
  { id:'air',     label:{zh:'航空货运',en:'Air Freight',ja:'航空貨物'},        color:'var(--cat-air)',     text:'var(--cat-air-t)' },
  { id:'sea',     label:{zh:'海运',    en:'Ocean Freight',ja:'海上輸送'},       color:'var(--cat-sea)',     text:'var(--cat-sea-t)' },
  { id:'customs', label:{zh:'清关',    en:'Customs',ja:'通関'},                 color:'var(--cat-customs)', text:'var(--cat-customs-t)' },
  { id:'reg',     label:{zh:'法规',    en:'Regulations',ja:'規制'},             color:'var(--cat-reg)',     text:'var(--cat-reg-t)' },
  { id:'market',  label:{zh:'市场动态',en:'Market Trends',ja:'市場動向'},       color:'var(--cat-market)',  text:'var(--cat-market-t)' },
]

const ARTICLES: Article[] = [
  {
    id:'A001', cat:'air', source:'Air Cargo World', date:'2026-04-28',
    title:{zh:'亚太航空货运量Q1同比增长12%',en:'Asia-Pacific Air Cargo Volume Up 12% YoY in Q1',ja:'アジア太平洋航空貨物量、Q1前年比12%増'},
    summary:{zh:'受电商持续增长驱动，亚太地区Q1航空货运量同比增长12%，中美航线尤为突出。',en:'Driven by continued e-commerce growth, Asia-Pacific Q1 air cargo volume surged 12% YoY, with the China-US lane showing the strongest performance.',ja:'電子商取引の継続的成長を背景に、アジア太平洋地区のQ1航空貨物量が前年比12%増加した。中米路線が特に好調だった。'},
    body:{zh:'根据国际航空运输协会（IATA）最新数据，2026年第一季度亚太地区航空货运量同比增长12%，远超全球平均水平7.3%。其中，中国至美国航线增幅最为显著，达到18%。分析人士认为，这一趋势主要得益于跨境电商的持续高速增长，以及半导体和电子产品出货量的大幅回升。主要承运人如国航货运、东航物流均报告运力接近满载，部分热门航线的运价较去年同期上涨约15%。业内预测，随着夏季传统旺季到来，运量将进一步提升，但运力扩张速度可能跟不上需求增长。',en:'According to the latest IATA data, Asia-Pacific air cargo volume in Q1 2026 grew 12% year-over-year, significantly exceeding the global average of 7.3%. The China-to-US route saw the strongest growth at 18%. Analysts attribute this trend primarily to the continued rapid expansion of cross-border e-commerce and a significant rebound in semiconductor and electronics shipments. Major carriers including Air China Cargo and Eastern Air Logistics report near-full capacity utilization, with rates on popular lanes up approximately 15% compared to the same period last year. Industry forecasts suggest volumes will rise further as the traditional summer peak season approaches, though capacity expansion may struggle to keep pace with demand.',ja:'IATAの最新データによると、2026年第1四半期のアジア太平洋地区の航空貨物量は前年同期比12%増加し、世界平均の7.3%を大きく上回った。中国から米国への路線が最も高い18%の増加を記録した。この傾向は、越境EC（電子商取引）の継続的な急成長と、半導体および電子機器の出荷量の大幅な回復によるものと分析されている。中国国際航空貨物や東方航空物流などの主要キャリアは輸送能力がほぼ満杯と報告しており、一部の人気路線の運賃は昨年同期比で約15%上昇している。'},
  },
  {
    id:'A002', cat:'air', source:'The Loadstar', date:'2026-04-27',
    title:{zh:'FRA机场货运吞吐量刷新历史纪录',en:'FRA Airport Sets New Air Cargo Throughput Record',ja:'フランクフルト空港、航空貨物取扱量で過去最高を記録'},
    summary:{zh:'法兰克福机场4月货运吞吐量突破20万吨，连续三个月创历史新高，成为欧洲最繁忙货运机场。',en:"Frankfurt Airport's April cargo throughput exceeded 200,000 tonnes, setting records for the third consecutive month and cementing its position as Europe's busiest cargo hub.",ja:'フランクフルト空港の4月の貨物取扱量が20万トンを突破し、3ヶ月連続で過去最高を更新した。'},
    body:{zh:'法兰克福机场（FRA）公布的最新数据显示，2026年4月份货物吞吐量达到201,500吨，同比增长14.2%，环比增长3.8%，连续第三个月刷新历史纪录。这一成绩使法兰克福机场进一步巩固了其欧洲最大航空货运枢纽的地位。增长动力来自多个方面：来自亚洲的电商包裹量继续大幅上升，汽车零部件和制药品的航空运输需求也保持旺盛。机场当局表示，新建的第三货运区将于年底投入使用，届时整体货运处理能力将提升约20%。德国汉莎货运作为法兰克福机场的最大单一运营商，业绩也随之创下新高。',en:"Frankfurt Airport (FRA) announced that April 2026 cargo throughput reached 201,500 tonnes, up 14.2% year-over-year and 3.8% month-on-month, setting records for the third consecutive month. This result further solidifies Frankfurt's position as Europe's largest air cargo hub. Growth drivers include continued strong increases in e-commerce parcels from Asia and robust demand for aerospace components and pharmaceuticals. Airport authorities noted that the new Third Cargo District will open by year-end, boosting overall cargo handling capacity by approximately 20%. Lufthansa Cargo, Frankfurt's largest single operator, also reported record performance.",ja:'フランクフルト空港(FRA)が発表した最新データによると、2026年4月の貨物取扱量は20万1,500トンに達し、前年同月比14.2%増、前月比3.8%増となり、3ヶ月連続で過去最高を更新した。この結果により、フランクフルトはヨーロッパ最大の航空貨物ハブとしての地位をさらに強固なものとした。'},
  },
  {
    id:'A003', cat:'customs', source:'Customs Today', date:'2026-04-26',
    title:{zh:'欧盟启动新版海关申报系统ICS2全面实施',en:'EU Fully Implements ICS2 — New Pre-Loading Advance Cargo Information System',ja:'EUがICS2の全面実施を開始 — 新事前積載貨物情報システム'},
    summary:{zh:'欧盟ICS2系统正式全面上线，所有进入欧盟的货物须在装载前提交货物信息，违规将导致货物延误或被拒载。',en:"The EU's ICS2 system is now fully operational. All cargo entering the EU must submit pre-loading cargo information, with non-compliance resulting in delays or refusal to load.",ja:'EUのICS2システムが全面稼働。EU向け全貨物について積載前の申告が義務化され、違反した場合は遅延または積載拒否となる。'},
    body:{zh:'欧盟海关委员会宣布，ICS2（进口管控系统第二阶段）已于4月25日起全面实施。该系统要求所有进入欧盟关税区的货物，必须在货物装载至运输工具之前，通过欧盟海关门户提交完整的预先货物信息（Entry Summary Declaration, ENS）。对于航空快件和邮件，提交截止时间为起飞前至少30分钟；对于普通航空货物，则为起飞前4小时。不合规的申报将导致货物被拒绝装载或在目的地机场被扣押检查。业界敦促货代和托运人确保系统对接和数据质量，避免因申报错误导致的延误损失。',en:'The EU Customs Committee announced that ICS2 (Import Control System Phase 2) is now fully operational as of April 25th. The system requires all cargo entering the EU customs territory to submit complete pre-loading advance cargo information (Entry Summary Declaration, ENS) through the EU Customs Portal before loading onto the transport means. For express shipments and mail, the deadline is at least 30 minutes before departure; for general air cargo, it is 4 hours before departure. Non-compliant declarations will result in cargo being refused for loading or held for inspection at the destination airport. The industry is urging freight forwarders and shippers to ensure system integration and data quality to avoid delays from declaration errors.',ja:'EU税関委員会は、ICS2（輸入管理システム第2フェーズ）が4月25日より全面施行されたと発表した。このシステムは、EU税関地域に入るすべての貨物について、輸送手段への積載前に、EUカスタムズポータルを通じて完全な事前積載貨物情報（入国要約申告書、ENS）を提出することを義務付けている。'},
  },
  {
    id:'A004', cat:'reg', source:'IATA Insights', date:'2026-04-25',
    title:{zh:'IATA更新锂电池航空运输规定，加强安全要求',en:'IATA Updates Lithium Battery Air Transport Regulations with Stricter Safety Requirements',ja:'IATAがリチウム電池航空輸送規定を改訂、安全要件を強化'},
    summary:{zh:'IATA发布DGR最新修订，对锂离子和锂金属电池的包装、标签及申报要求进行了重要更新，2026年7月1日起生效。',en:'IATA has released the latest DGR revision with important updates to packaging, labeling, and declaration requirements for lithium-ion and lithium metal batteries, effective July 1, 2026.',ja:'IATAが最新のDGR改訂版を発布。リチウムイオン電池とリチウム金属電池の梱包・ラベリング・申告要件を重要改訂。2026年7月1日から施行。'},
    body:{zh:'国际航空运输协会（IATA）近日发布了危险品规则（DGR）第67版的补充修订，其中对锂电池相关条款进行了重大调整，新规定将于2026年7月1日正式生效。主要变更包括：锂离子电池单独发运时，充电状态（SOC）不得超过30%（此前为50%）；运输包装要求升级，必须通过UN 38.3测试；标签尺寸统一调整为最小规格100mm x 100mm；含锂电池的设备发运时，需提供更详细的产品规格说明。货代和托运人需在7月1日前完成内部操作规程的更新，并对相关人员进行复训。不合规的货物将被拒绝承运，情节严重者可能面临监管处罚。',en:"IATA recently released a supplementary revision to the 67th edition of the Dangerous Goods Regulations (DGR), with significant changes to lithium battery provisions. The new rules take effect July 1, 2026. Key changes include: lithium-ion batteries shipped alone must not exceed 30% state of charge (SOC), down from the previous 50%; upgraded packaging requirements mandating UN 38.3 test compliance; standardized label dimensions increased to a minimum of 100mm x 100mm; and more detailed product specification documentation required for equipment containing lithium batteries. Freight forwarders and shippers must update internal operating procedures and retrain relevant personnel before July 1. Non-compliant cargo will be refused, and serious violations may attract regulatory penalties.",ja:'IATAは最近、危険物規則（DGR）第67版の補足改訂版を発表し、リチウム電池関連条項に大幅な変更が加えられた。新規定は2026年7月1日から発効する。主な変更点は：リチウムイオン電池単独輸送時の充電状態（SOC）上限が50%から30%に引き下げ；UN 38.3試験適合が義務付けられた梱包要件の強化；ラベルサイズの最小規格が100mm×100mmに統一；リチウム電池搭載機器の発送には詳細な製品仕様書が必要。'},
  },
  {
    id:'A005', cat:'market', source:'FreightWaves', date:'2026-04-24',
    title:{zh:'航空运费指数TAC连续四周上涨，市场供需趋紧',en:'TAC Air Freight Index Rises for Fourth Consecutive Week as Market Tightens',ja:'TACエアフレイト指数が4週連続上昇、市場が逼迫'},
    summary:{zh:'TAC航空货运指数显示，主要贸易航线运费连续四周上涨，上海至欧洲航线涨幅最大，每公斤运费突破4.5美元。',en:'The TAC air freight index shows rates rising for four consecutive weeks on major trade lanes. The Shanghai-Europe corridor saw the largest gains, with rates exceeding USD 4.50/kg.',ja:'TACエアフレイト指数によると、主要貿易航線で運賃が4週連続上昇。上海-ヨーロッパ間が最大上昇を示し、1kgあたり4.5ドルを突破した。'},
    body:{zh:'根据运输研究公司TAC Index最新发布的航空货运市场报告，截至4月23日当周，全球主要航线的航空运费已连续四周呈现上涨趋势。亚欧航线表现最为突出，上海至法兰克福的即期运价达到每公斤4.52美元，较四周前上涨约22%；上海至伦敦的运价也升至4.38美元/公斤。分析认为，推动本轮上涨的因素包括：电商旺季提前启动带来的额外需求、部分运力被政府包机占用、以及燃油附加费的上调。与此同时，腹舱运力供给受多家航空公司暑期旺季前排班调整影响，短期内有所收缩。市场参与者预期，运费高位将持续至Q2末。',en:"According to the latest air freight market report from transportation research firm TAC Index, global major lane air cargo rates have trended upward for four consecutive weeks as of the week ending April 23. The Asia-Europe corridor showed the strongest performance, with Shanghai-Frankfurt spot rates reaching USD 4.52/kg, up approximately 22% from four weeks earlier. Shanghai-London rates also climbed to USD 4.38/kg. Analysts attribute the current rate rally to a combination of factors: earlier-than-expected peak season demand from e-commerce, partial capacity diversion by government charter flights, and fuel surcharge increases. Meanwhile, belly cargo supply has contracted slightly as several carriers adjust schedules ahead of the summer peak season. Market participants expect elevated rates to persist through the end of Q2.",ja:'輸送調査会社TAC Indexの最新レポートによると、4月23日の週時点で、世界主要航線の航空運賃が4週連続で上昇傾向を示している。アジア-ヨーロッパ路線が最も強い動きを見せており、上海-フランクフルトのスポット運賃は4週前から約22%上昇し、1kgあたり4.52ドルに達した。上海-ロンドンの運賃も4.38ドル/kgに上昇した。'},
  },
  {
    id:'A006', cat:'sea', source:"Lloyd's List", date:'2026-04-23',
    title:{zh:'红海局势持续影响，亚欧海运绕行开普角成本高企',en:'Red Sea Disruptions Persist — Asia-Europe Ocean Freight Via Cape of Good Hope Costs Remain Elevated',ja:'紅海情勢が継続、アジア欧州間の喜望峰迂回コスト高止まり'},
    summary:{zh:'红海局势持续紧张，90%以上的亚欧集装箱班轮仍在绕行非洲好望角，航程增加约10天，运价维持高位。',en:'With Red Sea tensions persisting, over 90% of Asia-Europe container vessels continue routing via the Cape of Good Hope, adding ~10 days to transit times and keeping freight rates elevated.',ja:'紅海の緊張が続くなか、アジア欧州間のコンテナ船の90%以上が引き続き喜望峰経由で運航し、輸送時間が約10日延長し運賃が高止まり。'},
    body:{zh:'据最新统计，受红海局势影响，目前亚欧航线上超过90%的集装箱班轮仍在绕行非洲好望角，而非通过苏伊士运河。这条替代路线使单程航程增加约6,000海里，航行时间延长约10天。受此影响，上海至鹿特丹的40尺集装箱（FEU）即期运价仍维持在约4,200美元的高位，约为红海局势发生前的2倍。班轮公司同时面临船期可靠性下降的挑战——受绕行影响，定班准点率较正常水平下降约30%。部分货主已将时间敏感货物改由航空运输，导致旺季本已紧张的空运运力进一步承压。',en:"According to the latest statistics, more than 90% of Asia-Europe container vessels continue to route via the Cape of Good Hope rather than through the Suez Canal due to the ongoing Red Sea situation. This alternative route adds approximately 6,000 nautical miles and 10 days to a round trip. As a result, spot rates for a 40-foot container (FEU) from Shanghai to Rotterdam remain elevated at approximately USD 4,200, roughly double pre-Red Sea levels. Liner operators also face schedule reliability challenges — on-time performance has dropped approximately 30% below normal levels due to the detour. Some shippers have already shifted time-sensitive cargo to air freight, adding further pressure to an already tight peak-season air cargo market.",ja:'最新の統計によると、紅海情勢の影響により、現在もアジア欧州航線のコンテナ船の90%以上がスエズ運河ではなく喜望峰経由で航行している。この代替ルートにより、片道の航海距離は約6,000海里、航行日数は約10日増加した。その結果、上海からロッテルダムへの40フィートコンテナ(FEU)のスポット運賃は約4,200ドルの高水準を維持しており、紅海問題発生前の約2倍に相当する。'},
  },
  {
    id:'A007', cat:'customs', source:'Global Trade Magazine', date:'2026-04-22',
    title:{zh:'日本新版进口清关电子化系统NACCS全面升级',en:'Japan Upgrades NACCS Customs Clearance System to New Version',ja:'日本がNACCS通関システムを新バージョンに全面アップグレード'},
    summary:{zh:'日本海关NACCS系统完成重大升级，新增API对接接口，大幅缩短清关时间，货代系统对接指南已发布。',en:'Japan Customs has completed a major upgrade to the NACCS system, adding API integration interfaces and significantly reducing clearance times. Freight forwarder integration guides have been published.',ja:'日本税関がNACCSシステムの大規模アップグレードを完了。API連携インターフェースを追加し、通関時間を大幅短縮。フォワーダー向けシステム連携ガイドが公開された。'},
    body:{zh:'日本财务省海关局宣布，Nippon Automated Cargo and Port Consolidated System（NACCS）已完成第七次大版本升级，新系统于4月20日零时正式切换上线。本次升级的核心改进包括：新增标准RESTful API接口，允许货代公司和报关行通过API直接提交申报数据，无需再通过传统的专用EDI终端；增强了对电子商务进口小额申报的处理能力，单日可处理量从50万票提升至150万票；海关风险评估引擎采用AI模型重构，预计可将需人工审查的申报比例从12%降低至7%左右。日本海关已在官网发布针对货代的API对接技术指南，并提供6个月的双轨运行过渡期支持。',en:"Japan's Ministry of Finance Customs Bureau has announced the completion of the seventh major version upgrade of the Nippon Automated Cargo and Port Consolidated System (NACCS), with the new system going live at midnight on April 20. Key improvements include: new standard RESTful API interfaces allowing freight forwarders and customs brokers to submit declaration data directly via API, eliminating the need for legacy dedicated EDI terminals; enhanced processing capacity for e-commerce import small-value declarations, with daily capacity increasing from 500,000 to 1.5 million entries; and an AI-model rebuilt customs risk assessment engine expected to reduce the proportion of declarations requiring manual review from approximately 12% to 7%. Japan Customs has published API integration technical guidelines for freight forwarders on its official website, with a 6-month dual-operation transition period.",ja:'日本財務省税関局は、Nippon Automated Cargo and Port Consolidated System（NACCS）の第7回メジャーバージョンアップグレードが完了し、新システムが4月20日0時に正式に切り替わったと発表した。主な改善点は：標準RESTful APIインターフェースの新設により、フォワーダーや通関業者がAPIで直接申告データを提出できるようになり、従来の専用EDI端末が不要に；電子商取引輸入少額申告の処理能力を1日50万件から150万件に強化；AIモデルで再構築した税関リスク評価エンジンにより、人的審査が必要な申告比率を約12%から7%程度に削減見込み。'},
  },
  {
    id:'A008', cat:'market', source:'Air Cargo News', date:'2026-04-21',
    title:{zh:'半导体出货量激增推动航空货运需求，台湾和韩国货代抢位',en:'Semiconductor Surge Drives Air Freight Demand — Taiwan and Korea Forwarders in Booking Race',ja:'半導体出荷急増が航空貨物需要を牽引 — 台湾・韓国フォワーダーが予約争奪戦'},
    summary:{zh:'受AI芯片和存储器出货需求爆发，台湾NRT和TPE始发至北美的航空货运严重供不应求，临时订舱溢价高达35%。',en:'AI chip and memory shipment demand is driving severe shortage on Taiwan-North America and Korea-North America air lanes, with last-minute booking premiums reaching 35%.',ja:'AIチップと半導体メモリの需要急増により、台湾・韓国発北米行きの航空便が著しく逼迫。直前予約には35%のプレミアムが発生している。'},
    body:{zh:'随着全球对AI加速芯片和高带宽内存（HBM）需求持续攀升，台积电、SK海力士等半导体巨头的出货节奏明显加快，由此在亚太区北美航线的航空货运市场形成了显著的供需失衡。据多家货代反映，台北（TPE）和首尔（ICN）出发至洛杉矶（LAX）、纽约（JFK）的运力已严重告急，截至4月下旬，未来两周内几乎无法找到即期运力。部分货主为确保准时交货，被迫支付高达正常市场价35%的溢价寻找临时舱位。分析师指出，这一局面短期内难以缓解，主要原因是主要航空公司在该航线上的常规运力已被预订至5月中旬，而新增宽体货机交付计划最早也要到Q3才能落地。',en:'As global demand for AI accelerator chips and high-bandwidth memory (HBM) continues to surge, major semiconductor companies including TSMC and SK Hynix have significantly accelerated shipment pace, creating notable supply-demand imbalances in air cargo markets on Asia-Pacific to North America lanes. Multiple freight forwarders report severe capacity shortages on Taipei (TPE) and Seoul (ICN) to Los Angeles (LAX) and New York (JFK) routes, with almost no spot capacity available for the next two weeks as of late April. Some shippers, to ensure on-time delivery, have been forced to pay premiums as high as 35% above normal market rates to secure last-minute space. Analysts note that this situation is unlikely to ease in the short term, as major carrier regular capacity on these lanes is booked through mid-May, and new wide-body freighter deliveries are not scheduled until at least Q3.',ja:'AIアクセラレータチップと高帯域幅メモリ（HBM）への世界的需要が急増し続けるなか、TSMCやSKハイニックスなどの大手半導体企業は出荷ペースを大幅に加速させており、アジア太平洋地区から北米向けの航空貨物市場で顕著な需給不均衡が生じている。複数のフォワーダーによると、台北（TPE）とソウル（ICN）からロサンゼルス（LAX）とニューヨーク（JFK）への便の輸送能力は深刻に不足しており、4月下旬時点で今後2週間のスポット輸送能力はほぼ確保不可能な状況だ。'},
  },
]

export default function Page() {
  const [lang, setLang] = useState<Lang>('zh')
  const [filterCat, setFilterCat] = useState<Cat|null>(null)
  const [search, setSearch] = useState('')
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [detail, setDetail] = useState<Article|null>(null)

  const L = {
    zh: { h1:'航运行业新闻', all:'全部', bookmarked:'已收藏', search:'搜索新闻…', noResult:'暂无相关新闻', close:'关闭' },
    en: { h1:'Freight Industry News', all:'All', bookmarked:'Bookmarked', search:'Search news…', noResult:'No matching articles', close:'Close' },
    ja: { h1:'物流業界ニュース', all:'すべて', bookmarked:'ブックマーク', search:'ニュースを検索…', noResult:'該当記事なし', close:'閉じる' },
  }[lang]

  const getCat = (id: Cat) => CAT_INFO.find(c => c.id === id)!

  const filtered = useMemo(() => {
    return ARTICLES.filter(a => {
      if (showBookmarks && !bookmarks.has(a.id)) return false
      if (filterCat && a.cat !== filterCat) return false
      if (search) {
        const q = search.toLowerCase()
        return a.title[lang].toLowerCase().includes(q) || a.summary[lang].toLowerCase().includes(q)
      }
      return true
    })
  }, [filterCat, search, bookmarks, showBookmarks, lang])

  const catCounts = useMemo(() => {
    const m: Record<string,number> = {}
    ARTICLES.forEach(a => { m[a.cat] = (m[a.cat]||0)+1 })
    return m
  }, [])

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setBookmarks(prev => { const s = new Set(prev); s.has(id)?s.delete(id):s.add(id); return s })
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="header-icon">📰</div>
          <span className="header-title">{L.h1}</span>
        </div>
        <div className="lang-switcher">
          {LANGS.map(l => <button key={l.code} className={`lang-btn${lang===l.code?' active':''}`} onClick={()=>setLang(l.code)}>{l.label}</button>)}
        </div>
      </header>
      <div className="main">
        <div className="sidebar">
          <input className="search-input" placeholder={L.search} value={search} onChange={e=>setSearch(e.target.value)} />
          <div className="filter-card">
            <div className="filter-title">{lang==='zh'?'分类':lang==='en'?'Category':'カテゴリ'}</div>
            <button className={`filter-btn${!filterCat&&!showBookmarks?' active':''}`} onClick={()=>{setFilterCat(null);setShowBookmarks(false)}}>
              <div className="filter-dot" style={{background:'var(--muted)'}}/>
              <span className="filter-label">{L.all}</span>
              <span className="filter-count">{ARTICLES.length}</span>
            </button>
            {CAT_INFO.map(c => (
              <button key={c.id} className={`filter-btn${filterCat===c.id&&!showBookmarks?' active':''}`} onClick={()=>{setFilterCat(c.id);setShowBookmarks(false)}}>
                <div className="filter-dot" style={{background:c.color.replace('var(--cat-','').replace(')','').includes('air')?'#3b82f6':c.id==='sea'?'#10b981':c.id==='customs'?'#f59e0b':c.id==='reg'?'#8b5cf6':'#f43f5e'}}/>
                <span className="filter-label">{c.label[lang]}</span>
                <span className="filter-count">{catCounts[c.id]||0}</span>
              </button>
            ))}
          </div>
          <div className="filter-card">
            <button className={`filter-btn${showBookmarks?' active':''}`} onClick={()=>{setShowBookmarks(b=>!b);setFilterCat(null)}}>
              <span style={{fontSize:14}}>🔖</span>
              <span className="filter-label">{L.bookmarked}</span>
              <span className="filter-count">{bookmarks.size}</span>
            </button>
          </div>
        </div>
        <div className="articles">
          {filtered.length === 0 && <div style={{padding:'40px 20px',textAlign:'center',color:'var(--muted)'}}>{L.noResult}</div>}
          {filtered.map(a => {
            const cat = getCat(a.cat)
            const dotColor = a.cat==='air'?'#3b82f6':a.cat==='sea'?'#10b981':a.cat==='customs'?'#f59e0b':a.cat==='reg'?'#8b5cf6':'#f43f5e'
            return (
              <div key={a.id} className={`article-card${bookmarks.has(a.id)?' bookmarked':''}`} onClick={()=>setDetail(a)}>
                <div className="article-top">
                  <div className="article-cat" style={{background:cat.color,color:cat.text}}>{cat.label[lang]}</div>
                  <div className="article-title">{a.title[lang]}</div>
                </div>
                <div className="article-summary">{a.summary[lang]}</div>
                <div className="article-footer">
                  <span className="article-source">{a.source}</span>
                  <span className="article-date">{a.date}</span>
                  <button className={`bookmark-btn${bookmarks.has(a.id)?' active':''}`} onClick={e=>toggleBookmark(a.id,e)}>
                    {bookmarks.has(a.id)?'🔖':'🏷️'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {detail && (
        <div className="modal-overlay" onClick={()=>setDetail(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={()=>setDetail(null)}>×</button>
              {(() => { const cat = getCat(detail.cat); return <div className="modal-cat" style={{background:cat.color,color:cat.text}}>{cat.label[lang]}</div> })()}
              <div className="modal-title">{detail.title[lang]}</div>
              <div className="modal-meta">{detail.source} · {detail.date}</div>
            </div>
            <div className="modal-body">
              {detail.body[lang].split('\n').map((p,i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
