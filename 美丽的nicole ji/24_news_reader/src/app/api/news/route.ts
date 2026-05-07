import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();
const PAGE_SIZE = 10;

// 各话题对应的 RSS 订阅源
const FEEDS: Record<string, string[]> = {
  aviation: [
    'https://simpleflying.com/feed/',
    'https://www.aviationpros.com/rss/all-aviation',
  ],
  logistics: [
    'https://theloadstar.com/feed/',
    'https://www.logisticsmgmt.com/rss',
  ],
  customs: [
    'https://www.freightwaves.com/news/category/customs/feed',
    'https://theloadstar.com/feed/',
  ],
  shipping: [
    'https://www.hellenicshippingnews.com/feed/',
    'https://splash247.com/feed/',
  ],
};

export async function GET(req: NextRequest) {
  const p       = req.nextUrl.searchParams;
  const topic   = p.get('topic') ?? 'aviation';
  const page    = parseInt(p.get('page') ?? '1', 10);

  const feedUrls = FEEDS[topic] ?? FEEDS.aviation;

  try {
    // 同时请求多个 RSS 源，合并结果
    const results = await Promise.allSettled(
      feedUrls.map(url => parser.parseURL(url))
    );

    // 收集所有成功的文章，过滤掉失败的
    const allItems = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => (r as PromiseFulfilledResult<Parser.Output<Parser.Item>>).value.items)
      .filter(item => item.title && item.link)
      .sort((a, b) => {
        // 按发布时间倒序
        return new Date(b.pubDate ?? 0).getTime() - new Date(a.pubDate ?? 0).getTime();
      });

    // 分页处理
    const total      = allItems.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage   = Math.min(Math.max(1, page), totalPages);
    const start      = (safePage - 1) * PAGE_SIZE;
    const articles   = allItems.slice(start, start + PAGE_SIZE).map(item => ({
      title:       item.title ?? '',
      description: item.contentSnippet ?? item.content ?? null,
      url:         item.link ?? '',
      urlToImage:  null,
      publishedAt: item.pubDate ?? '',
      source:      { name: item.creator ?? new URL(item.link ?? 'https://example.com').hostname },
    }));

    return NextResponse.json({ articles, totalResults: total, page: safePage, totalPages });

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'RSS 获取失败' },
      { status: 500 }
    );
  }
}
