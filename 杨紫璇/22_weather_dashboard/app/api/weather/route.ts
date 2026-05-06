import { NextResponse } from 'next/server';

const CITIES = [
  { name: '東京', query: 'Tokyo,JP' },
  { name: '上海', query: 'Shanghai,CN' },
  { name: '烟台', query: 'Yantai,CN' },
];

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

function processForecasts(list: ForecastItem[]) {
  const byDate: Record<string, ForecastItem[]> = {};
  for (const item of list) {
    const date = item.dt_txt.split(' ')[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(item);
  }

  return Object.entries(byDate)
    .slice(0, 3)
    .map(([date, items]) => {
      const noon =
        items.find((i) => i.dt_txt.includes('12:00:00')) ||
        items[Math.floor(items.length / 2)];
      return {
        date,
        temp: Math.round(noon.main.temp),
        tempMin: Math.round(Math.min(...items.map((i) => i.main.temp_min))),
        tempMax: Math.round(Math.max(...items.map((i) => i.main.temp_max))),
        humidity: noon.main.humidity,
        description: noon.weather[0].description,
        icon: noon.weather[0].icon,
        main: noon.weather[0].main,
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
    const results = await Promise.all(
      CITIES.map(async (city) => {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${city.query}&appid=${apiKey}&units=metric&lang=zh_cn&cnt=24`,
          { next: { revalidate: 1800 } }
        );

        if (!res.ok) {
          throw new Error(`${city.name}の天気取得に失敗しました (HTTP ${res.status})`);
        }

        const data = await res.json();

        return {
          city: city.name,
          country: data.city.country,
          forecasts: processForecasts(data.list),
        };
      })
    );

    return NextResponse.json({ cities: results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '天気データの取得に失敗しました' },
      { status: 502 }
    );
  }
}
