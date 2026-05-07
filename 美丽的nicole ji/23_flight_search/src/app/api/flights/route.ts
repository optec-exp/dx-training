import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const apiKey = process.env.AVIATIONSTACK_API_KEY;

  // ① Key 未配置时报错
  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured. Set AVIATIONSTACK_API_KEY in .env.local' },
      { status: 500 }
    );
  }

  // ② 从 URL 拿到用户传来的搜索参数
  //    例如：/api/flights?dep=NRT&arr=LHR
  const p   = req.nextUrl.searchParams;
  const dep = p.get('dep') ?? '';  // 出发地 IATA 代码
  const arr = p.get('arr') ?? '';  // 目的地 IATA 代码（用于前端过滤）

  if (!dep) {
    return NextResponse.json(
      { error: '请输入出发地' },
      { status: 400 }
    );
  }

  // ③ 用 URLSearchParams 把参数拼成查询字符串
  //    免费版只支持单条件：dep_iata
  //    目的地过滤在后端返回后做
  const params = new URLSearchParams({
    access_key: apiKey,
    dep_iata:   dep.toUpperCase(),
    limit:      '50',
  });

  try {
    // ④ 向外部 API 发请求（API Key 在服务端，不暴露给浏览器）
    //    AviationStack 免费版只支持 http（不是 https）
    const res = await fetch(
      `http://api.aviationstack.com/v1/flights?${params}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `外部 API 错误 (HTTP ${res.status})` },
        { status: 502 }
      );
    }

    const data = await res.json();

    // ⑤ API 返回错误信息时处理
    if (data.error) {
      return NextResponse.json(
        { error: data.error.message ?? '查询失败' },
        { status: 400 }
      );
    }

    // ⑥ 如果有目的地条件，在后端过滤后再返回
    let flights = data.data ?? [];
    if (arr) {
      const arrUpper = arr.toUpperCase();
      flights = flights.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (f: any) => f.arrival?.iata === arrUpper
      );
    }

    return NextResponse.json({
      flights,
      total: flights.length,
    });

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '网络错误' },
      { status: 500 }
    );
  }
}
