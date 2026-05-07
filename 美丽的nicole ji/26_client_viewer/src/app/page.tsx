'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ── 颜色常量 ──────────────────────────────────────────────
const C = {
  bg:      '#f0f4f8',
  white:   '#ffffff',
  primary: '#0050b3',
  accent:  '#1677ff',
  text:    '#1a1a2e',
  sub:     '#5a6a7a',
  border:  '#d0dae6',
  hover:   '#eef4ff',
};

interface Client {
  id:   string;
  name: string;
}

export default function Home() {
  const [clients,  setClients]  = useState<Client[]>([]);
  const [filtered, setFiltered] = useState<Client[]>([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // ── 初次加载客户列表 ──────────────────────────────────
  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(json => {
        if (json.error) { setError(json.error); return; }
        setClients(json.clients ?? []);
        setFiltered(json.clients ?? []);
      })
      .catch(() => setError('网络错误'))
      .finally(() => setLoading(false));
  }, []);

  // ── 搜索过滤（客户端过滤，不需要请求服务器）──────────
  useEffect(() => {
    const q = search.trim().toLowerCase();
    setFiltered(
      q ? clients.filter(c => c.name.toLowerCase().includes(q)) : clients
    );
  }, [search, clients]);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>

      {/* 顶部标题栏 */}
      <header style={{
        background: C.primary, color: '#fff',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,.2)',
      }}>
        <span style={{ fontSize: 22 }}>🏢</span>
        <span style={{ fontSize: 18, fontWeight: 700 }}>客户列表</span>
        {!loading && (
          <span style={{ marginLeft: 'auto', fontSize: 13, opacity: .85 }}>
            共 {clients.length} 家客户
          </span>
        )}
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>

        {/* 搜索框 */}
        <input
          type="text"
          placeholder="🔍 搜索客户名..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 16px',
            borderRadius: 8, border: `1px solid ${C.border}`,
            fontSize: 15, marginBottom: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,.06)',
            outline: 'none',
          }}
        />

        {/* 加载中 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: C.sub }}>
            <div style={{
              display: 'inline-block',
              width: 28, height: 28,
              border: `3px solid ${C.border}`,
              borderTopColor: C.accent,
              borderRadius: '50%',
              animation: 'spin .8s linear infinite',
              marginBottom: 12,
            }} />
            <div>正在加载客户列表...</div>
          </div>
        )}

        {/* 错误 */}
        {error && (
          <div style={{
            background: '#fff2f0', border: '1px solid #ffccc7',
            borderRadius: 8, padding: '12px 16px', color: '#cf1322',
          }}>
            ⚠ {error}
          </div>
        )}

        {/* ── 客户列表 ─────────────────────────────────── */}
        {/* 核心知识点：Link 组件 → 跳转到 /clients/[id]  */}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', color: C.sub, padding: 32 }}>
                没有找到符合的客户
              </div>
            ) : (
              <div style={{
                background: C.white, borderRadius: 10,
                boxShadow: '0 1px 4px rgba(0,0,0,.08)',
                overflow: 'hidden',
              }}>
                {filtered.map((client, i) => (
                  // ── Link：点击跳转到详情页 ─────────────
                  // href = /clients/[顧客名 URL encoded]
                  <Link
                    key={client.id}
                    href={`/clients/${encodeURIComponent(client.name)}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '14px 20px',
                      borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                      textDecoration: 'none',
                      color: C.text,
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.hover)}
                    onMouseLeave={e => (e.currentTarget.style.background = C.white)}
                  >
                    {/* 头像图标 */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: C.primary,
                      color: '#fff', fontWeight: 700, fontSize: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginRight: 14, flexShrink: 0,
                    }}>
                      {client.name.charAt(0)}
                    </div>

                    {/* 客户名 */}
                    <span style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>
                      {client.name}
                    </span>

                    {/* 箭头 */}
                    <span style={{ color: C.sub, fontSize: 18 }}>›</span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
