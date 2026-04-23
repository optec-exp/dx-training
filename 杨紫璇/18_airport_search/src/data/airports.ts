export interface Airport {
  iata: string;
  icao: string;
  name_en: string;
  name_zh: string;
  city_zh: string;
  country: string;
  region: '亚洲' | '欧洲' | '北美' | '中东' | '大洋洲' | '南美';
  lat: number;
  lng: number;
}

export const AIRPORTS: Airport[] = [
  // 日本
  { iata: 'NRT', icao: 'RJAA', name_en: 'Tokyo Narita International Airport',    name_zh: '东京成田国际机场',  city_zh: '东京', country: '日本', region: '亚洲', lat: 35.7647, lng: 140.3864 },
  { iata: 'HND', icao: 'RJTT', name_en: 'Tokyo Haneda Airport',                  name_zh: '东京羽田机场',      city_zh: '东京', country: '日本', region: '亚洲', lat: 35.5494, lng: 139.7798 },
  { iata: 'KIX', icao: 'RJBB', name_en: 'Osaka Kansai International Airport',    name_zh: '大阪关西国际机场',  city_zh: '大阪', country: '日本', region: '亚洲', lat: 34.4272, lng: 135.2440 },
  { iata: 'NGO', icao: 'RJGG', name_en: 'Nagoya Chubu Centrair International',   name_zh: '名古屋中部国际机场',city_zh: '名古屋',country: '日本', region: '亚洲', lat: 34.8583, lng: 136.8054 },
  { iata: 'CTS', icao: 'RJCC', name_en: 'New Chitose Airport',                   name_zh: '新千岁机场',        city_zh: '札幌', country: '日本', region: '亚洲', lat: 42.7752, lng: 141.6922 },
  { iata: 'FUK', icao: 'RJFF', name_en: 'Fukuoka Airport',                       name_zh: '福冈机场',          city_zh: '福冈', country: '日本', region: '亚洲', lat: 33.5859, lng: 130.4511 },
  // 中国
  { iata: 'PVG', icao: 'ZSPD', name_en: 'Shanghai Pudong International Airport', name_zh: '上海浦东国际机场',  city_zh: '上海', country: '中国', region: '亚洲', lat: 31.1434, lng: 121.8052 },
  { iata: 'SHA', icao: 'ZSSS', name_en: 'Shanghai Hongqiao International Airport',name_zh: '上海虹桥国际机场',  city_zh: '上海', country: '中国', region: '亚洲', lat: 31.1979, lng: 121.3364 },
  { iata: 'PEK', icao: 'ZBAA', name_en: 'Beijing Capital International Airport', name_zh: '北京首都国际机场',  city_zh: '北京', country: '中国', region: '亚洲', lat: 40.0799, lng: 116.6031 },
  { iata: 'PKX', icao: 'ZBAD', name_en: 'Beijing Daxing International Airport',  name_zh: '北京大兴国际机场',  city_zh: '北京', country: '中国', region: '亚洲', lat: 39.5098, lng: 116.4105 },
  { iata: 'CAN', icao: 'ZGGG', name_en: 'Guangzhou Baiyun International Airport',name_zh: '广州白云国际机场',  city_zh: '广州', country: '中国', region: '亚洲', lat: 23.3924, lng: 113.2988 },
  { iata: 'SZX', icao: 'ZGSZ', name_en: 'Shenzhen Bao\'an International Airport',name_zh: '深圳宝安国际机场',  city_zh: '深圳', country: '中国', region: '亚洲', lat: 22.6393, lng: 113.8107 },
  { iata: 'CTU', icao: 'ZUUU', name_en: 'Chengdu Tianfu International Airport',  name_zh: '成都天府国际机场',  city_zh: '成都', country: '中国', region: '亚洲', lat: 30.3124, lng: 104.4440 },
  { iata: 'XIY', icao: 'ZLXY', name_en: 'Xi\'an Xianyang International Airport', name_zh: '西安咸阳国际机场',  city_zh: '西安', country: '中国', region: '亚洲', lat: 34.4471, lng: 108.7516 },
  { iata: 'YNT', icao: 'ZSYT', name_en: 'Yantai Penglai International Airport',  name_zh: '烟台蓬莱国际机场',  city_zh: '烟台', country: '中国', region: '亚洲', lat: 37.6572, lng: 120.9875 },
  // 香港・台湾・韩国
  { iata: 'HKG', icao: 'VHHH', name_en: 'Hong Kong International Airport',       name_zh: '香港国际机场',      city_zh: '香港', country: '香港', region: '亚洲', lat: 22.3080, lng: 113.9185 },
  { iata: 'TPE', icao: 'RCTP', name_en: 'Taipei Taoyuan International Airport',  name_zh: '台北桃园国际机场',  city_zh: '台北', country: '台湾', region: '亚洲', lat: 25.0777, lng: 121.2328 },
  { iata: 'TSA', icao: 'RCSS', name_en: 'Taipei Songshan Airport',               name_zh: '台北松山机场',      city_zh: '台北', country: '台湾', region: '亚洲', lat: 25.0694, lng: 121.5524 },
  { iata: 'ICN', icao: 'RKSI', name_en: 'Incheon International Airport',         name_zh: '仁川国际机场',      city_zh: '首尔', country: '韩国', region: '亚洲', lat: 37.4602, lng: 126.4407 },
  { iata: 'GMP', icao: 'RKSS', name_en: 'Gimpo International Airport',           name_zh: '金浦国际机场',      city_zh: '首尔', country: '韩国', region: '亚洲', lat: 37.5583, lng: 126.7906 },
  // 东南亚
  { iata: 'SIN', icao: 'WSSS', name_en: 'Singapore Changi Airport',              name_zh: '新加坡樟宜机场',    city_zh: '新加坡',country: '新加坡',region: '亚洲', lat: 1.3644, lng: 103.9915 },
  { iata: 'BKK', icao: 'VTBS', name_en: 'Suvarnabhumi Airport',                  name_zh: '素万那普机场',      city_zh: '曼谷', country: '泰国', region: '亚洲', lat: 13.6900, lng: 100.7501 },
  { iata: 'DMK', icao: 'VTBD', name_en: 'Don Mueang International Airport',      name_zh: '廊曼国际机场',      city_zh: '曼谷', country: '泰国', region: '亚洲', lat: 13.9126, lng: 100.6067 },
  { iata: 'KUL', icao: 'WMKK', name_en: 'Kuala Lumpur International Airport',    name_zh: '吉隆坡国际机场',    city_zh: '吉隆坡',country: '马来西亚',region: '亚洲', lat: 2.7456, lng: 101.7099 },
  { iata: 'CGK', icao: 'WIII', name_en: 'Soekarno-Hatta International Airport',  name_zh: '苏加诺-哈达国际机场',city_zh: '雅加达',country: '印度尼西亚',region: '亚洲', lat: -6.1256, lng: 106.6559 },
  { iata: 'MNL', icao: 'RPLL', name_en: 'Ninoy Aquino International Airport',    name_zh: '尼诺伊·阿基诺国际机场',city_zh: '马尼拉',country: '菲律宾',region: '亚洲', lat: 14.5086, lng: 121.0197 },
  { iata: 'SGN', icao: 'VVTS', name_en: 'Tan Son Nhat International Airport',    name_zh: '新山一国际机场',    city_zh: '胡志明市',country: '越南',region: '亚洲', lat: 10.8188, lng: 106.6520 },
  { iata: 'HAN', icao: 'VVNB', name_en: 'Noi Bai International Airport',         name_zh: '内排国际机场',      city_zh: '河内', country: '越南', region: '亚洲', lat: 21.2212, lng: 105.8072 },
  // 南亚
  { iata: 'DEL', icao: 'VIDP', name_en: 'Indira Gandhi International Airport',   name_zh: '英迪拉·甘地国际机场',city_zh: '新德里',country: '印度',region: '亚洲', lat: 28.5665, lng: 77.1031 },
  { iata: 'BOM', icao: 'VABB', name_en: 'Chhatrapati Shivaji Maharaj International', name_zh: '孟买国际机场',  city_zh: '孟买', country: '印度', region: '亚洲', lat: 19.0896, lng: 72.8656 },
  // 欧洲
  { iata: 'LHR', icao: 'EGLL', name_en: 'London Heathrow Airport',               name_zh: '伦敦希思罗机场',    city_zh: '伦敦', country: '英国', region: '欧洲', lat: 51.4775, lng: -0.4614 },
  { iata: 'LGW', icao: 'EGKK', name_en: 'London Gatwick Airport',                name_zh: '伦敦盖特威克机场',  city_zh: '伦敦', country: '英国', region: '欧洲', lat: 51.1481, lng: -0.1903 },
  { iata: 'CDG', icao: 'LFPG', name_en: 'Paris Charles de Gaulle Airport',       name_zh: '巴黎戴高乐机场',    city_zh: '巴黎', country: '法国', region: '欧洲', lat: 49.0097, lng: 2.5478 },
  { iata: 'FRA', icao: 'EDDF', name_en: 'Frankfurt Airport',                     name_zh: '法兰克福机场',      city_zh: '法兰克福',country: '德国',region: '欧洲', lat: 50.0379, lng: 8.5622 },
  { iata: 'MUC', icao: 'EDDM', name_en: 'Munich Airport',                        name_zh: '慕尼黑机场',        city_zh: '慕尼黑',country: '德国', region: '欧洲', lat: 48.3537, lng: 11.7750 },
  { iata: 'AMS', icao: 'EHAM', name_en: 'Amsterdam Schiphol Airport',            name_zh: '阿姆斯特丹史基浦机场',city_zh: '阿姆斯特丹',country: '荷兰',region: '欧洲', lat: 52.3086, lng: 4.7639 },
  { iata: 'ZRH', icao: 'LSZH', name_en: 'Zurich Airport',                        name_zh: '苏黎世机场',        city_zh: '苏黎世',country: '瑞士', region: '欧洲', lat: 47.4647, lng: 8.5492 },
  { iata: 'VIE', icao: 'LOWW', name_en: 'Vienna International Airport',          name_zh: '维也纳国际机场',    city_zh: '维也纳',country: '奥地利',region: '欧洲', lat: 48.1103, lng: 16.5697 },
  { iata: 'MAD', icao: 'LEMD', name_en: 'Adolfo Suárez Madrid-Barajas Airport',  name_zh: '马德里-巴拉哈斯机场',city_zh: '马德里',country: '西班牙',region: '欧洲', lat: 40.4719, lng: -3.5626 },
  { iata: 'FCO', icao: 'LIRF', name_en: 'Leonardo da Vinci International Airport',name_zh: '罗马菲乌米奇诺机场',city_zh: '罗马', country: '意大利',region: '欧洲', lat: 41.8003, lng: 12.2389 },
  { iata: 'BRU', icao: 'EBBR', name_en: 'Brussels Airport',                      name_zh: '布鲁塞尔机场',      city_zh: '布鲁塞尔',country: '比利时',region: '欧洲', lat: 50.9014, lng: 4.4844 },
  { iata: 'HEL', icao: 'EFHK', name_en: 'Helsinki-Vantaa Airport',               name_zh: '赫尔辛基-万塔机场', city_zh: '赫尔辛基',country: '芬兰',region: '欧洲', lat: 60.3172, lng: 24.9633 },
  // 北美
  { iata: 'JFK', icao: 'KJFK', name_en: 'John F. Kennedy International Airport', name_zh: '纽约肯尼迪国际机场',city_zh: '纽约', country: '美国', region: '北美', lat: 40.6413, lng: -73.7781 },
  { iata: 'EWR', icao: 'KEWR', name_en: 'Newark Liberty International Airport',  name_zh: '纽瓦克自由国际机场',city_zh: '纽约', country: '美国', region: '北美', lat: 40.6925, lng: -74.1687 },
  { iata: 'LAX', icao: 'KLAX', name_en: 'Los Angeles International Airport',     name_zh: '洛杉矶国际机场',    city_zh: '洛杉矶',country: '美国', region: '北美', lat: 33.9425, lng: -118.4081 },
  { iata: 'ORD', icao: 'KORD', name_en: 'O\'Hare International Airport',         name_zh: '芝加哥奥黑尔国际机场',city_zh: '芝加哥',country: '美国',region: '北美', lat: 41.9742, lng: -87.9073 },
  { iata: 'SFO', icao: 'KSFO', name_en: 'San Francisco International Airport',   name_zh: '旧金山国际机场',    city_zh: '旧金山',country: '美国', region: '北美', lat: 37.6213, lng: -122.3790 },
  { iata: 'MIA', icao: 'KMIA', name_en: 'Miami International Airport',           name_zh: '迈阿密国际机场',    city_zh: '迈阿密',country: '美国', region: '北美', lat: 25.7959, lng: -80.2870 },
  { iata: 'ATL', icao: 'KATL', name_en: 'Hartsfield-Jackson Atlanta International', name_zh: '亚特兰大国际机场',city_zh: '亚特兰大',country: '美国',region: '北美', lat: 33.6407, lng: -84.4277 },
  { iata: 'DFW', icao: 'KDFW', name_en: 'Dallas/Fort Worth International Airport',name_zh: '达拉斯沃思堡国际机场',city_zh: '达拉斯',country: '美国',region: '北美', lat: 32.8998, lng: -97.0403 },
  { iata: 'YYZ', icao: 'CYYZ', name_en: 'Toronto Pearson International Airport', name_zh: '多伦多皮尔逊国际机场',city_zh: '多伦多',country: '加拿大',region: '北美', lat: 43.6772, lng: -79.6306 },
  { iata: 'YVR', icao: 'CYVR', name_en: 'Vancouver International Airport',       name_zh: '温哥华国际机场',    city_zh: '温哥华',country: '加拿大',region: '北美', lat: 49.1967, lng: -123.1815 },
  // 中东
  { iata: 'DXB', icao: 'OMDB', name_en: 'Dubai International Airport',           name_zh: '迪拜国际机场',      city_zh: '迪拜', country: '阿联酋',region: '中东', lat: 25.2532, lng: 55.3657 },
  { iata: 'AUH', icao: 'OMAA', name_en: 'Abu Dhabi International Airport',       name_zh: '阿布扎比国际机场',  city_zh: '阿布扎比',country: '阿联酋',region: '中东', lat: 24.4330, lng: 54.6511 },
  { iata: 'DOH', icao: 'OTHH', name_en: 'Hamad International Airport',           name_zh: '哈马德国际机场',    city_zh: '多哈', country: '卡塔尔',region: '中东', lat: 25.2731, lng: 51.6081 },
  { iata: 'RUH', icao: 'OERK', name_en: 'King Khalid International Airport',     name_zh: '哈立德国王国际机场',city_zh: '利雅得',country: '沙特',  region: '中东', lat: 24.9576, lng: 46.6988 },
  { iata: 'KWI', icao: 'OKBK', name_en: 'Kuwait International Airport',          name_zh: '科威特国际机场',    city_zh: '科威特城',country: '科威特',region: '中东', lat: 29.2267, lng: 47.9689 },
  { iata: 'BAH', icao: 'OBBI', name_en: 'Bahrain International Airport',         name_zh: '巴林国际机场',      city_zh: '麦纳麦',country: '巴林',  region: '中东', lat: 26.2708, lng: 50.6336 },
  // 大洋洲
  { iata: 'SYD', icao: 'YSSY', name_en: 'Sydney Kingsford Smith Airport',        name_zh: '悉尼金斯福德·史密斯机场',city_zh: '悉尼',country: '澳大利亚',region: '大洋洲', lat: -33.9461, lng: 151.1772 },
  { iata: 'MEL', icao: 'YMML', name_en: 'Melbourne Airport',                     name_zh: '墨尔本机场',        city_zh: '墨尔本',country: '澳大利亚',region: '大洋洲', lat: -37.6690, lng: 144.8410 },
  { iata: 'BNE', icao: 'YBBN', name_en: 'Brisbane Airport',                      name_zh: '布里斯班机场',      city_zh: '布里斯班',country: '澳大利亚',region: '大洋洲', lat: -27.3842, lng: 153.1175 },
  { iata: 'AKL', icao: 'NZAA', name_en: 'Auckland Airport',                      name_zh: '奥克兰机场',        city_zh: '奥克兰',country: '新西兰',region: '大洋洲', lat: -37.0082, lng: 174.7850 },
  // 南美
  { iata: 'GRU', icao: 'SBGR', name_en: 'São Paulo-Guarulhos International Airport', name_zh: '圣保罗瓜鲁柳斯国际机场', city_zh: '圣保罗', country: '巴西', region: '南美', lat: -23.4356, lng: -46.4731 },
  { iata: 'EZE', icao: 'SAEZ', name_en: 'Ministro Pistarini International Airport',  name_zh: '布宜诺斯艾利斯国际机场', city_zh: '布宜诺斯艾利斯', country: '阿根廷', region: '南美', lat: -34.8222, lng: -58.5358 },
];

export const REGIONS = ['亚洲', '欧洲', '北美', '中东', '大洋洲', '南美'] as const;
