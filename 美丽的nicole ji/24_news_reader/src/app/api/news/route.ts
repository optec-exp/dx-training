import { NextRequest, NextResponse } from 'next/server';

const PAGE_SIZE = 10; // 每页显示10条新闻

export async function GET(req: NextRequest) {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured. Set NEWS_API_KEY in .env.local' },
      { status: 500 }
    );
  }

  // 从 URL 读取参数
  // 例如：/api/news?q=aviation&page=2
  const p    = req.nextUrl.searchParams;
  const q    = p.get('q') ?? 'aviation logistics';  // 搜索关键词
  const page = parseInt(p.get('page') ?? '1', 10);  // 当前第几页，默认第1页

  // 构建 NewsAPI 的请求 URL
  // 作品24 核心：用 page 参数实现分页
  const params = new URLSearchParams({
    q:        q,
    language: 'en',
    sortBy:   'publishedAt',      // 按发布时间排序（最新在前）
    pageSize: String(PAGE_SIZE),  // 每页10条
    page:     String(page),       // 第几页
    apiKey:   apiKey,
  });

  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?${params}`,
      { next: { revalidate: 900 } }  // 缓存15分钟
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `NewsAPI 错误 (HTTP ${res.status})` },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (data.status !== 'ok') {
      return NextResponse.json(
        { error: data.message ?? '获取新闻失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      articles:   data.articles ?? [],
      totalResults: data.totalResults ?? 0,
      page,
      pageSize:   PAGE_SIZE,
      // 总页数（最多 10 页，NewsAPI 免费版限制）
      totalPages: Math.min(Math.ceil((data.totalResults ?? 0) / PAGE_SIZE), 10),
    });

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '网络错误' },
      { status: 500 }
    );
  }
}
