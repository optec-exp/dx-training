'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

// ── 类型定义 ──────────────────────────────────────────────
interface Article {
  title:       string;
  description: string | null;
  url:         string;
  urlToImage:  string | null;
  publishedAt: string;
  source:      { name: string };
}

interface NewsData {
  articles:     Article[];
  totalResults: number;
  page:         number;
  totalPages:   number;
}

// ── 话题选项 ──────────────────────────────────────────────
const TOPICS = [
  { label: '✈ 航空',   q: 'aviation airline' },
  { label: '📦 物流',   q: 'logistics freight cargo' },
  { label: '🛃 海关',   q: 'customs import export trade' },
  { label: '🚢 海运',   q: 'shipping container port' },
];

// ── 日期格式化 ────────────────────────────────────────────
function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  } catch { return iso; }
}

// ── 图片错误处理 ──────────────────────────────────────────
function NewsImage({ src, alt }: { src: string | null; alt: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return <div className="news-img-placeholder">📰</div>;
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={100}
      height={70}
      className="news-img"
      onError={() => setErr(true)}
      unoptimized
    />
  );
}

// ── 主页面 ───────────────────────────────────────────────
export default function Home() {
  const [topicIdx, setTopicIdx] = useState(0);   // 当前选中的话题
  const [page, setPage]         = useState(1);    // 当前页码
  const [data, setData]         = useState<NewsData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // ── 获取新闻 ─────────────────────────────────────────
  // 每当 topicIdx 或 page 变化，重新请求
  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      q:    TOPICS[topicIdx].q,
      page: String(page),
    });

    fetch(`/api/news?${params}`)
      .then(res => res.json())
      .then(json => {
        if (json.error) setError(json.error);
        else setData(json);
        setLoading(false);
      })
      .catch(() => {
        setError('网络错误，请检查连接。');
        setLoading(false);
      });
  }, [topicIdx, page]);
  // ↑ 依赖数组：topicIdx 或 page 变了就重新执行

  // ── 切换话题时回到第1页 ───────────────────────────────
  const changeTopic = (idx: number) => {
    setTopicIdx(idx);
    setPage(1);       // 重要：换话题时要回到第1页
    setData(null);
  };

  return (
    <div className="app">

      {/* 顶部标题栏 */}
      <header className="header">
        <div className="header-left">
          <span className="header-icon">📰</span>
          <span className="header-title">航空・物流 新闻阅读器</span>
        </div>
      </header>

      <main className="main">

        {/* 话题选择 */}
        <div className="tabs">
          {TOPICS.map((t, i) => (
            <button
              key={t.q}
              className={`tab${topicIdx === i ? ' active' : ''}`}
              onClick={() => changeTopic(i)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 加载中 */}
        {loading && (
          <div className="loading">
            <div className="spinner" />
            <span>正在获取新闻...</span>
          </div>
        )}

        {/* 错误 */}
        {!loading && error && (
          <div className="error-box">⚠ {error}</div>
        )}

        {/* 新闻列表 */}
        {!loading && !error && data && (
          <>
            <div className="news-list">
              {data.articles
                .filter(a => a.title !== '[Removed]')  // 过滤掉已删除的文章
                .map((article, i) => (
                  <div key={i} className="news-card">

                    {/* 图片 */}
                    <NewsImage src={article.urlToImage} alt={article.title} />

                    {/* 内容 */}
                    <div className="news-body">
                      <div className="news-meta">
                        <span className="news-source">{article.source.name}</span>
                        <span className="news-date">{fmtDate(article.publishedAt)}</span>
                      </div>

                      {/* 标题 — 点击跳转原文 */}
                      <div className="news-title">
                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                          {article.title}
                        </a>
                      </div>

                      {/* 摘要 */}
                      {article.description && (
                        <p className="news-desc">{article.description}</p>
                      )}

                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="read-link"
                      >
                        阅读原文 →
                      </a>
                    </div>

                  </div>
                ))}
            </div>

            {/* 分页 */}
            {/* 作品24 核心：page 状态管理 */}
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage(p => p - 1)}
                disabled={page <= 1}
              >
                ← 上一页
              </button>

              <span className="page-info">
                第 {page} / {data.totalPages} 页
              </span>

              <button
                className="page-btn"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.totalPages}
              >
                下一页 →
              </button>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
