export type Lang = 'ja' | 'zh' | 'en'

export type Airport = {
  code: string
  name: Record<Lang, string>
  city: Record<Lang, string>
  country: string
  countryName: Record<Lang, string>
  lat: number
  lng: number
}

export const airports: Airport[] = [
  // ── Japan ──────────────────────────────────────────────────────
  { code:'NRT', name:{ja:'東京成田国際空港',zh:'东京成田国际机场',en:'Tokyo Narita Intl'}, city:{ja:'東京',zh:'东京',en:'Tokyo'}, country:'JP', countryName:{ja:'日本',zh:'日本',en:'Japan'}, lat:35.7647, lng:140.3864 },
  { code:'KIX', name:{ja:'関西国際空港',zh:'关西国际机场',en:'Kansai Intl'}, city:{ja:'大阪',zh:'大阪',en:'Osaka'}, country:'JP', countryName:{ja:'日本',zh:'日本',en:'Japan'}, lat:34.4273, lng:135.2440 },
  { code:'NGO', name:{ja:'中部国際空港',zh:'中部国际机场',en:'Chubu Centrair Intl'}, city:{ja:'名古屋',zh:'名古屋',en:'Nagoya'}, country:'JP', countryName:{ja:'日本',zh:'日本',en:'Japan'}, lat:34.8584, lng:136.8050 },
  { code:'FUK', name:{ja:'福岡空港',zh:'福冈机场',en:'Fukuoka Airport'}, city:{ja:'福岡',zh:'福冈',en:'Fukuoka'}, country:'JP', countryName:{ja:'日本',zh:'日本',en:'Japan'}, lat:33.5858, lng:130.4508 },
  { code:'CTS', name:{ja:'新千歳空港',zh:'新千岁机场',en:'New Chitose Airport'}, city:{ja:'札幌',zh:'札幌',en:'Sapporo'}, country:'JP', countryName:{ja:'日本',zh:'日本',en:'Japan'}, lat:42.7752, lng:141.6921 },
  // ── China Mainland ─────────────────────────────────────────────
  { code:'PEK', name:{ja:'北京首都国際空港',zh:'北京首都国际机场',en:'Beijing Capital Intl'}, city:{ja:'北京',zh:'北京',en:'Beijing'}, country:'CN', countryName:{ja:'中国',zh:'中国',en:'China'}, lat:40.0799, lng:116.6031 },
  { code:'PKX', name:{ja:'北京大興国際空港',zh:'北京大兴国际机场',en:'Beijing Daxing Intl'}, city:{ja:'北京',zh:'北京',en:'Beijing'}, country:'CN', countryName:{ja:'中国',zh:'中国',en:'China'}, lat:39.5090, lng:116.4104 },
  { code:'PVG', name:{ja:'上海浦東国際空港',zh:'上海浦东国际机场',en:'Shanghai Pudong Intl'}, city:{ja:'上海',zh:'上海',en:'Shanghai'}, country:'CN', countryName:{ja:'中国',zh:'中国',en:'China'}, lat:31.1443, lng:121.8083 },
  { code:'SHA', name:{ja:'上海虹橋国際空港',zh:'上海虹桥国际机场',en:'Shanghai Hongqiao Intl'}, city:{ja:'上海',zh:'上海',en:'Shanghai'}, country:'CN', countryName:{ja:'中国',zh:'中国',en:'China'}, lat:31.1979, lng:121.3363 },
  { code:'CAN', name:{ja:'広州白雲国際空港',zh:'广州白云国际机场',en:'Guangzhou Baiyun Intl'}, city:{ja:'広州',zh:'广州',en:'Guangzhou'}, country:'CN', countryName:{ja:'中国',zh:'中国',en:'China'}, lat:23.3924, lng:113.2988 },
  { code:'CTU', name:{ja:'成都天府国際空港',zh:'成都天府国际机场',en:'Chengdu Tianfu Intl'}, city:{ja:'成都',zh:'成都',en:'Chengdu'}, country:'CN', countryName:{ja:'中国',zh:'中国',en:'China'}, lat:30.3124, lng:104.4442 },
  { code:'SZX', name:{ja:'深圳宝安国際空港',zh:'深圳宝安国际机场',en:'Shenzhen Bao\'an Intl'}, city:{ja:'深圳',zh:'深圳',en:'Shenzhen'}, country:'CN', countryName:{ja:'中国',zh:'中国',en:'China'}, lat:22.6393, lng:113.8107 },
  { code:'XIY', name:{ja:'西安咸陽国際空港',zh:'西安咸阳国际机场',en:'Xi\'an Xianyang Intl'}, city:{ja:'西安',zh:'西安',en:"Xi'an"}, country:'CN', countryName:{ja:'中国',zh:'中国',en:'China'}, lat:34.4474, lng:108.7518 },
  // ── Hong Kong / Taiwan / Korea ─────────────────────────────────
  { code:'HKG', name:{ja:'香港国際空港',zh:'香港国际机场',en:'Hong Kong Intl'}, city:{ja:'香港',zh:'香港',en:'Hong Kong'}, country:'HK', countryName:{ja:'香港',zh:'香港',en:'Hong Kong'}, lat:22.3080, lng:113.9185 },
  { code:'TPE', name:{ja:'台湾桃園国際空港',zh:'台湾桃园国际机场',en:'Taiwan Taoyuan Intl'}, city:{ja:'台北',zh:'台北',en:'Taipei'}, country:'TW', countryName:{ja:'台湾',zh:'台湾',en:'Taiwan'}, lat:25.0777, lng:121.2324 },
  { code:'ICN', name:{ja:'仁川国際空港',zh:'仁川国际机场',en:'Incheon Intl'}, city:{ja:'ソウル',zh:'首尔',en:'Seoul'}, country:'KR', countryName:{ja:'韓国',zh:'韩国',en:'South Korea'}, lat:37.4602, lng:126.4407 },
  { code:'PUS', name:{ja:'金海国際空港',zh:'金海国际机场',en:'Gimhae Intl'}, city:{ja:'釜山',zh:'釜山',en:'Busan'}, country:'KR', countryName:{ja:'韓国',zh:'韩国',en:'South Korea'}, lat:35.1796, lng:128.9380 },
  // ── SE Asia ────────────────────────────────────────────────────
  { code:'BKK', name:{ja:'スワンナプーム国際空港',zh:'素万那普国际机场',en:'Suvarnabhumi Intl'}, city:{ja:'バンコク',zh:'曼谷',en:'Bangkok'}, country:'TH', countryName:{ja:'タイ',zh:'泰国',en:'Thailand'}, lat:13.6811, lng:100.7474 },
  { code:'DMK', name:{ja:'ドンムアン国際空港',zh:'廊曼国际机场',en:'Don Mueang Intl'}, city:{ja:'バンコク',zh:'曼谷',en:'Bangkok'}, country:'TH', countryName:{ja:'タイ',zh:'泰国',en:'Thailand'}, lat:13.9126, lng:100.6067 },
  { code:'SIN', name:{ja:'シンガポール・チャンギ空港',zh:'新加坡樟宜机场',en:'Singapore Changi'}, city:{ja:'シンガポール',zh:'新加坡',en:'Singapore'}, country:'SG', countryName:{ja:'シンガポール',zh:'新加坡',en:'Singapore'}, lat:1.3644, lng:103.9915 },
  { code:'KUL', name:{ja:'クアラルンプール国際空港',zh:'吉隆坡国际机场',en:'Kuala Lumpur Intl'}, city:{ja:'クアラルンプール',zh:'吉隆坡',en:'Kuala Lumpur'}, country:'MY', countryName:{ja:'マレーシア',zh:'马来西亚',en:'Malaysia'}, lat:2.7456, lng:101.7099 },
  { code:'CGK', name:{ja:'スカルノ・ハッタ国際空港',zh:'苏加诺-哈达国际机场',en:'Soekarno-Hatta Intl'}, city:{ja:'ジャカルタ',zh:'雅加达',en:'Jakarta'}, country:'ID', countryName:{ja:'インドネシア',zh:'印度尼西亚',en:'Indonesia'}, lat:-6.1256, lng:106.6559 },
  { code:'MNL', name:{ja:'ニノイ・アキノ国際空港',zh:'尼诺伊·阿基诺国际机场',en:'Ninoy Aquino Intl'}, city:{ja:'マニラ',zh:'马尼拉',en:'Manila'}, country:'PH', countryName:{ja:'フィリピン',zh:'菲律宾',en:'Philippines'}, lat:14.5086, lng:121.0197 },
  { code:'SGN', name:{ja:'タンソンニャット国際空港',zh:'新山一国际机场',en:'Tan Son Nhat Intl'}, city:{ja:'ホーチミン',zh:'胡志明市',en:'Ho Chi Minh City'}, country:'VN', countryName:{ja:'ベトナム',zh:'越南',en:'Vietnam'}, lat:10.8188, lng:106.6520 },
  { code:'HAN', name:{ja:'ノイバイ国際空港',zh:'内排国际机场',en:'Noi Bai Intl'}, city:{ja:'ハノイ',zh:'河内',en:'Hanoi'}, country:'VN', countryName:{ja:'ベトナム',zh:'越南',en:'Vietnam'}, lat:21.2187, lng:105.8043 },
  { code:'RGN', name:{ja:'ヤンゴン国際空港',zh:'仰光国际机场',en:'Yangon Intl'}, city:{ja:'ヤンゴン',zh:'仰光',en:'Yangon'}, country:'MM', countryName:{ja:'ミャンマー',zh:'缅甸',en:'Myanmar'}, lat:16.9073, lng:96.1332 },
  // ── South Asia ─────────────────────────────────────────────────
  { code:'DEL', name:{ja:'インディラ・ガンジー国際空港',zh:'英迪拉·甘地国际机场',en:'Indira Gandhi Intl'}, city:{ja:'デリー',zh:'德里',en:'Delhi'}, country:'IN', countryName:{ja:'インド',zh:'印度',en:'India'}, lat:28.5665, lng:77.1031 },
  { code:'BOM', name:{ja:'チャトラパティ・シヴァジー国際空港',zh:'贾特拉帕蒂·希瓦吉国际机场',en:'Chhatrapati Shivaji Intl'}, city:{ja:'ムンバイ',zh:'孟买',en:'Mumbai'}, country:'IN', countryName:{ja:'インド',zh:'印度',en:'India'}, lat:19.0896, lng:72.8656 },
  { code:'CMB', name:{ja:'バンダラナイケ国際空港',zh:'班达拉奈克国际机场',en:'Bandaranaike Intl'}, city:{ja:'コロンボ',zh:'科伦坡',en:'Colombo'}, country:'LK', countryName:{ja:'スリランカ',zh:'斯里兰卡',en:'Sri Lanka'}, lat:7.1808, lng:79.8841 },
  { code:'DAC', name:{ja:'ハズラット・シャージャラール国際空港',zh:'沙贾拉勒国际机场',en:'Hazrat Shahjalal Intl'}, city:{ja:'ダッカ',zh:'达卡',en:'Dhaka'}, country:'BD', countryName:{ja:'バングラデシュ',zh:'孟加拉国',en:'Bangladesh'}, lat:23.8433, lng:90.3978 },
  // ── Middle East ────────────────────────────────────────────────
  { code:'DXB', name:{ja:'ドバイ国際空港',zh:'迪拜国际机场',en:'Dubai Intl'}, city:{ja:'ドバイ',zh:'迪拜',en:'Dubai'}, country:'AE', countryName:{ja:'UAE',zh:'阿联酋',en:'UAE'}, lat:25.2528, lng:55.3644 },
  { code:'DOH', name:{ja:'ハマド国際空港',zh:'哈马德国际机场',en:'Hamad Intl'}, city:{ja:'ドーハ',zh:'多哈',en:'Doha'}, country:'QA', countryName:{ja:'カタール',zh:'卡塔尔',en:'Qatar'}, lat:25.2608, lng:51.6138 },
  { code:'AUH', name:{ja:'アブダビ国際空港',zh:'阿布扎比国际机场',en:'Abu Dhabi Intl'}, city:{ja:'アブダビ',zh:'阿布扎比',en:'Abu Dhabi'}, country:'AE', countryName:{ja:'UAE',zh:'阿联酋',en:'UAE'}, lat:24.4430, lng:54.6511 },
  { code:'RUH', name:{ja:'キング・ハーリド国際空港',zh:'哈立德国王国际机场',en:'King Khalid Intl'}, city:{ja:'リヤド',zh:'利雅得',en:'Riyadh'}, country:'SA', countryName:{ja:'サウジアラビア',zh:'沙特阿拉伯',en:'Saudi Arabia'}, lat:24.9576, lng:46.6988 },
  { code:'JED', name:{ja:'キング・アブドゥルアジーズ国際空港',zh:'阿卜杜勒阿齐兹国王国际机场',en:'King Abdulaziz Intl'}, city:{ja:'ジッダ',zh:'吉达',en:'Jeddah'}, country:'SA', countryName:{ja:'サウジアラビア',zh:'沙特阿拉伯',en:'Saudi Arabia'}, lat:21.6796, lng:39.1565 },
  { code:'MCT', name:{ja:'マスカット国際空港',zh:'马斯喀特国际机场',en:'Muscat Intl'}, city:{ja:'マスカット',zh:'马斯喀特',en:'Muscat'}, country:'OM', countryName:{ja:'オマーン',zh:'阿曼',en:'Oman'}, lat:23.5934, lng:58.2844 },
  // ── Australia / NZ ─────────────────────────────────────────────
  { code:'SYD', name:{ja:'シドニー・キングスフォード・スミス国際空港',zh:'悉尼金斯福德·史密斯国际机场',en:'Sydney Kingsford Smith'}, city:{ja:'シドニー',zh:'悉尼',en:'Sydney'}, country:'AU', countryName:{ja:'オーストラリア',zh:'澳大利亚',en:'Australia'}, lat:-33.9399, lng:151.1753 },
  { code:'MEL', name:{ja:'メルボルン空港',zh:'墨尔本机场',en:'Melbourne Airport'}, city:{ja:'メルボルン',zh:'墨尔本',en:'Melbourne'}, country:'AU', countryName:{ja:'オーストラリア',zh:'澳大利亚',en:'Australia'}, lat:-37.6690, lng:144.8410 },
  { code:'BNE', name:{ja:'ブリスベン空港',zh:'布里斯班机场',en:'Brisbane Airport'}, city:{ja:'ブリスベン',zh:'布里斯班',en:'Brisbane'}, country:'AU', countryName:{ja:'オーストラリア',zh:'澳大利亚',en:'Australia'}, lat:-27.3842, lng:153.1175 },
  { code:'AKL', name:{ja:'オークランド空港',zh:'奥克兰机场',en:'Auckland Airport'}, city:{ja:'オークランド',zh:'奥克兰',en:'Auckland'}, country:'NZ', countryName:{ja:'ニュージーランド',zh:'新西兰',en:'New Zealand'}, lat:-37.0082, lng:174.7917 },
  // ── Europe ─────────────────────────────────────────────────────
  { code:'LHR', name:{ja:'ロンドン・ヒースロー空港',zh:'伦敦希思罗机场',en:'London Heathrow'}, city:{ja:'ロンドン',zh:'伦敦',en:'London'}, country:'GB', countryName:{ja:'イギリス',zh:'英国',en:'United Kingdom'}, lat:51.4775, lng:-0.4614 },
  { code:'CDG', name:{ja:'パリ・シャルル・ド・ゴール空港',zh:'巴黎戴高乐机场',en:'Paris Charles de Gaulle'}, city:{ja:'パリ',zh:'巴黎',en:'Paris'}, country:'FR', countryName:{ja:'フランス',zh:'法国',en:'France'}, lat:49.0097, lng:2.5479 },
  { code:'FRA', name:{ja:'フランクフルト空港',zh:'法兰克福机场',en:'Frankfurt Airport'}, city:{ja:'フランクフルト',zh:'法兰克福',en:'Frankfurt'}, country:'DE', countryName:{ja:'ドイツ',zh:'德国',en:'Germany'}, lat:50.0379, lng:8.5622 },
  { code:'AMS', name:{ja:'アムステルダム・スキポール空港',zh:'阿姆斯特丹史基浦机场',en:'Amsterdam Schiphol'}, city:{ja:'アムステルダム',zh:'阿姆斯特丹',en:'Amsterdam'}, country:'NL', countryName:{ja:'オランダ',zh:'荷兰',en:'Netherlands'}, lat:52.3105, lng:4.7683 },
  { code:'ZRH', name:{ja:'チューリッヒ空港',zh:'苏黎世机场',en:'Zurich Airport'}, city:{ja:'チューリッヒ',zh:'苏黎世',en:'Zurich'}, country:'CH', countryName:{ja:'スイス',zh:'瑞士',en:'Switzerland'}, lat:47.4647, lng:8.5492 },
  { code:'FCO', name:{ja:'ローマ・フィウミチーノ空港',zh:'罗马菲乌米奇诺机场',en:'Rome Fiumicino'}, city:{ja:'ローマ',zh:'罗马',en:'Rome'}, country:'IT', countryName:{ja:'イタリア',zh:'意大利',en:'Italy'}, lat:41.8003, lng:12.2389 },
  { code:'MAD', name:{ja:'マドリード・バラハス空港',zh:'马德里巴拉哈斯机场',en:'Madrid Barajas'}, city:{ja:'マドリード',zh:'马德里',en:'Madrid'}, country:'ES', countryName:{ja:'スペイン',zh:'西班牙',en:'Spain'}, lat:40.4936, lng:-3.5668 },
  { code:'VIE', name:{ja:'ウィーン国際空港',zh:'维也纳国际机场',en:'Vienna Intl'}, city:{ja:'ウィーン',zh:'维也纳',en:'Vienna'}, country:'AT', countryName:{ja:'オーストリア',zh:'奥地利',en:'Austria'}, lat:48.1103, lng:16.5697 },
  { code:'MUC', name:{ja:'ミュンヘン空港',zh:'慕尼黑机场',en:'Munich Airport'}, city:{ja:'ミュンヘン',zh:'慕尼黑',en:'Munich'}, country:'DE', countryName:{ja:'ドイツ',zh:'德国',en:'Germany'}, lat:48.3537, lng:11.7750 },
  { code:'BRU', name:{ja:'ブリュッセル空港',zh:'布鲁塞尔机场',en:'Brussels Airport'}, city:{ja:'ブリュッセル',zh:'布鲁塞尔',en:'Brussels'}, country:'BE', countryName:{ja:'ベルギー',zh:'比利时',en:'Belgium'}, lat:50.9010, lng:4.4844 },
  { code:'CPH', name:{ja:'コペンハーゲン空港',zh:'哥本哈根机场',en:'Copenhagen Airport'}, city:{ja:'コペンハーゲン',zh:'哥本哈根',en:'Copenhagen'}, country:'DK', countryName:{ja:'デンマーク',zh:'丹麦',en:'Denmark'}, lat:55.6180, lng:12.6560 },
  { code:'HEL', name:{ja:'ヘルシンキ・ヴァンター空港',zh:'赫尔辛基万塔机场',en:'Helsinki Vantaa'}, city:{ja:'ヘルシンキ',zh:'赫尔辛基',en:'Helsinki'}, country:'FI', countryName:{ja:'フィンランド',zh:'芬兰',en:'Finland'}, lat:60.3172, lng:24.9633 },
  // ── Americas ───────────────────────────────────────────────────
  { code:'JFK', name:{ja:'ジョン・F・ケネディ国際空港',zh:'约翰·F·肯尼迪国际机场',en:'John F. Kennedy Intl'}, city:{ja:'ニューヨーク',zh:'纽约',en:'New York'}, country:'US', countryName:{ja:'アメリカ',zh:'美国',en:'United States'}, lat:40.6413, lng:-73.7781 },
  { code:'LAX', name:{ja:'ロサンゼルス国際空港',zh:'洛杉矶国际机场',en:'Los Angeles Intl'}, city:{ja:'ロサンゼルス',zh:'洛杉矶',en:'Los Angeles'}, country:'US', countryName:{ja:'アメリカ',zh:'美国',en:'United States'}, lat:33.9425, lng:-118.4081 },
  { code:'ORD', name:{ja:'シカゴ・オヘア国際空港',zh:'芝加哥奥黑尔国际机场',en:"Chicago O'Hare Intl"}, city:{ja:'シカゴ',zh:'芝加哥',en:'Chicago'}, country:'US', countryName:{ja:'アメリカ',zh:'美国',en:'United States'}, lat:41.9742, lng:-87.9073 },
  { code:'MIA', name:{ja:'マイアミ国際空港',zh:'迈阿密国际机场',en:'Miami Intl'}, city:{ja:'マイアミ',zh:'迈阿密',en:'Miami'}, country:'US', countryName:{ja:'アメリカ',zh:'美国',en:'United States'}, lat:25.7959, lng:-80.2870 },
  { code:'SFO', name:{ja:'サンフランシスコ国際空港',zh:'旧金山国际机场',en:'San Francisco Intl'}, city:{ja:'サンフランシスコ',zh:'旧金山',en:'San Francisco'}, country:'US', countryName:{ja:'アメリカ',zh:'美国',en:'United States'}, lat:37.6213, lng:-122.3790 },
  { code:'YYZ', name:{ja:'トロント・ピアソン国際空港',zh:'多伦多皮尔逊国际机场',en:'Toronto Pearson Intl'}, city:{ja:'トロント',zh:'多伦多',en:'Toronto'}, country:'CA', countryName:{ja:'カナダ',zh:'加拿大',en:'Canada'}, lat:43.6777, lng:-79.6248 },
  { code:'MEX', name:{ja:'ベニート・フアレス国際空港',zh:'贝尼托·胡亚雷斯国际机场',en:'Benito Juárez Intl'}, city:{ja:'メキシコシティ',zh:'墨西哥城',en:'Mexico City'}, country:'MX', countryName:{ja:'メキシコ',zh:'墨西哥',en:'Mexico'}, lat:19.4363, lng:-99.0721 },
  { code:'GRU', name:{ja:'グアルーリョス国際空港',zh:'瓜鲁柳斯国际机场',en:'São Paulo Guarulhos Intl'}, city:{ja:'サンパウロ',zh:'圣保罗',en:'São Paulo'}, country:'BR', countryName:{ja:'ブラジル',zh:'巴西',en:'Brazil'}, lat:-23.4356, lng:-46.4731 },
  // ── Africa ─────────────────────────────────────────────────────
  { code:'JNB', name:{ja:'オーアール・タンボ国際空港',zh:'OR坦博国际机场',en:'O.R. Tambo Intl'}, city:{ja:'ヨハネスブルグ',zh:'约翰内斯堡',en:'Johannesburg'}, country:'ZA', countryName:{ja:'南アフリカ',zh:'南非',en:'South Africa'}, lat:-26.1367, lng:28.2416 },
  { code:'NBO', name:{ja:'ジョモ・ケニヤッタ国際空港',zh:'乔莫·肯雅塔国际机场',en:'Jomo Kenyatta Intl'}, city:{ja:'ナイロビ',zh:'内罗毕',en:'Nairobi'}, country:'KE', countryName:{ja:'ケニア',zh:'肯尼亚',en:'Kenya'}, lat:-1.3192, lng:36.9275 },
  { code:'CAI', name:{ja:'カイロ国際空港',zh:'开罗国际机场',en:'Cairo Intl'}, city:{ja:'カイロ',zh:'开罗',en:'Cairo'}, country:'EG', countryName:{ja:'エジプト',zh:'埃及',en:'Egypt'}, lat:30.1127, lng:31.4000 },
  { code:'CMN', name:{ja:'モハメッド5世国際空港',zh:'穆罕默德五世国际机场',en:'Mohammed V Intl'}, city:{ja:'カサブランカ',zh:'卡萨布兰卡',en:'Casablanca'}, country:'MA', countryName:{ja:'モロッコ',zh:'摩洛哥',en:'Morocco'}, lat:33.3675, lng:-7.5900 },
]

export function searchAirports(query: string, lang: Lang): Airport[] {
  const q = query.trim()
  if (q.length < 1) return []
  const ql = q.toLowerCase()
  const qu = q.toUpperCase()

  return airports.filter(a => {
    if (a.code.startsWith(qu)) return true
    if (a.country === qu) return true
    const fields = [
      a.city[lang], a.city.en,
      a.name[lang], a.name.en,
      a.countryName[lang], a.countryName.en,
    ]
    return fields.some(f => f?.toLowerCase().includes(ql))
  }).slice(0, 8)
}
