import { NextResponse } from 'next/server';

// 三个目标城市
const CITIES = [
  { name: '东京', query: 'Tokyo,JP' },
  { name: '上海', query: 'Shanghai,CN' },
  { name: '烟台', query: 'Yantai,CN' },
];

// 单条预报数据的类型
interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: { description: string; icon: string; main: string }[];
  dt_txt: string;
}

// 把原始数据整理成"每天一条"的格式
function processForecasts(list: ForecastItem[]) {
  // 按日期分组
  const byDate: Record<string, ForecastItem[]> = {};
  for (const item of list) {
    const date = item.dt_txt.split(' ')[0]; // 取 "2025-05-07" 部分
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(item);
  }

  // 取前3天，每天取中午12点那条（代表当天天气）
  return Object.entries(byDate)
    .slice(0, 3)
    .map(([date, items]) => {
      const noon =
        items.find(i => i.dt_txt.includes('12:00:00')) ||
        items[Math.floor(items.length / 2)];
      return {
        date,
        temp:        Math.round(noon.main.temp),
        tempMin:     Math.round(Math.min(...items.map(i => i.main.temp_min))),
        tempMax:     Math.round(Math.max(...items.map(i => i.main.temp_max))),
        humidity:    noon.main.humidity,
        description: noon.weather[0].description,
        icon:        noon.weather[0].icon,
        main:        noon.weather[0].main,
      };
    });
}

export async function GET() {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured. Set OPENWEATHER_API_KEY in .env.local' },
      { status: 500 }
    );
  }

  try {
    // Promise.all = 三个城市同时请求，不用一个一个等
    const results = await Promise.all(
      CITIES.map(async (city) => {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${city.query}&appid=${apiKey}&units=metric&lang=zh_cn&cnt=24`,
          { next: { revalidate: 1800 } } // 缓存30分钟
        );

        if (!res.ok) {
          throw new Error(`${city.name}天气获取失败 (HTTP ${res.status})`);
        }

        const data = await res.json();
        return {
          city:      city.name,
          country:   data.city.country,
          forecasts: processForecasts(data.list),
        };
      })
    );

    return NextResponse.json({ cities: results });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '天气数据获取失败' },
      { status: 502 }
    );
  }
}
