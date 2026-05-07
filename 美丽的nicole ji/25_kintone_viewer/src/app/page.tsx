'use client';

import { useState, useEffect, useCallback } from 'react';

// ── 颜色常量 ──────────────────────────────────────────────
const C = {
  bg:       '#f0f4f8',
  white:    '#ffffff',
  primary:  '#0050b3',
  accent:   '#1677ff',
  text:     '#1a1a2e',
  sub:      '#5a6a7a',
  border:   '#d0dae6',
  rowHover: '#eef4ff',
  green:    '#389e0d',
  orange:   '#d46b08',
  red:      '#cf1322',
  gray:     '#8c8c8c',
};

// ── 类型定义 ──────────────────────────────────────────────
// Kintone 每个字段值的格式是 { value: string }
interface KintoneRecord {
  $id:          { value: string };
  当社案件番号: { value: string };
  顧客名:       { value: string };
  案件テーマ:   { value: string };
  操作ステータス: { value: string };
  Mode:         { value: string };
  ETD:          { value: string };
  ETA:          { value: string };
  AWB_NO:       { value: string };
  作成日時:     { value: string };
}

// ── 状态对应颜色 ──────────────────────────────────────────
function statusColor(s: string): string {
  if (s.includes('処理中') || s.includes('进行中')) return C.orange;
  if (s.includes('完了') || s.includes('完成'))    return C.green;
  if (s.includes('確認') || s.includes('确认'))    return C.accent;
  if (s.includes('キャンセル') || s.includes('取消')) return C.red;
  return C.gray;
}

// ── 日期格式化 ────────────────────────────────────────────
function fmtDate(s: string): string {
  if (!s) return '—';
  try {
    // ETD/ETA 可能是 "2024-12-01" 格式
    return s.slice(0, 10);
  } catch { return s; }
}

// ── 主页面 ───────────────────────────────────────────────
export default function Home() {
  // ── 状态变量 ─────────────────────────────────────────
  const [records,  setRecords]  = useState<KintoneRecord[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // 过滤条件
  const [search,   setSearch]   = useState('');     // 关键词搜索
  const [status,   setStatus]   = useState('');     // 状态过滤
  const [mode,     setMode]     = useState('');     // Mode 过滤

  // 分页
  const [offset,   setOffset]   = useState(0);      // 从第几条开始
  const [hasMore,  setHasMore]  = useState(true);   // 是否还有更多数据

  // 动态获取到的状态列表（从数据中提取）
  const [statusList, setStatusList] = useState<string[]>([]);

  // ── 搜索防抖 ─────────────────────────────────────────
  // 防抖：用户停止输入 500ms 后再请求，避免每按一个键都请求
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);  // 清理上一个 timer
  }, [search]);

  // ── 获取数据 ─────────────────────────────────────────
  const fetchRecords = useCallback(async (reset: boolean) => {
    setLoading(true);
    setError(null);

    const currentOffset = reset ? 0 : offset;

    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (status)          params.set('status', status);
    if (mode)            params.set('mode', mode);
    params.set('offset', String(currentOffset));

    try {
      const res  = await fetch(`/api/records?${params}`);
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        setLoading(false);
        return;
      }

      const newRecords: KintoneRecord[] = json.records ?? [];

      if (reset) {
        setRecords(newRecords);
        setOffset(newRecords.length);
      } else {
        setRecords(prev => [...prev, ...newRecords]);
        setOffset(prev => prev + newRecords.length);
      }

      // 如果返回数量 < 50，说明没有更多了
      setHasMore(newRecords.length === 50);

      // 动态提取状态列表（只在首次加载时更新）
      if (reset && newRecords.length > 0) {
        const statuses = Array.from(
          new Set(newRecords.map((r: KintoneRecord) => r.操作ステータス?.value).filter(Boolean))
        ) as string[];
        if (statuses.length > 0) setStatusList(statuses);
      }

    } catch {
      setError('网络请求失败，请检查连接。');
    }

    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, mode]);

  // ── 过滤条件变化时重新请求 ────────────────────────────
  useEffect(() => {
    setOffset(0);
    fetchRecords(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, mode]);

  // ── 加载更多 ─────────────────────────────────────────
  const loadMore = () => fetchRecords(false);

  // ── 切换状态过滤 ─────────────────────────────────────
  const toggleStatus = (s: string) => {
    setStatus(prev => prev === s ? '' : s);
  };

  // ──────────────────────────────────────────────────────
  // 渲染
  // ──────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>

      {/* 顶部标题栏 */}
      <header style={{
        background: C.primary, color: '#fff',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,.2)',
      }}>
        <span style={{ fontSize: 22 }}>📋</span>
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>
          Kintone 案件列表
        </span>
        {records.length > 0 && (
          <span style={{
            marginLeft: 'auto', fontSize: 13, opacity: .85,
          }}>
            显示 {records.length} 件
          </span>
        )}
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── 过滤栏 ───────────────────────────────────── */}
        <div style={{
          background: C.white, borderRadius: 10,
          padding: '16px 20px', marginBottom: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,.08)',
          display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
        }}>

          {/* 关键词搜索 */}
          <input
            type="text"
            placeholder="🔍 搜索 案件番号 / 顧客名 / テーマ / AWB..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: '1 1 260px', minWidth: 200,
              padding: '8px 12px', borderRadius: 6,
              border: `1px solid ${C.border}`, fontSize: 14,
              outline: 'none',
            }}
          />

          {/* Mode 下拉 */}
          <select
            value={mode}
            onChange={e => setMode(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 6,
              border: `1px solid ${C.border}`, fontSize: 14,
              background: C.white, cursor: 'pointer',
            }}
          >
            <option value="">全部 Mode</option>
            <option value="Export">Export</option>
            <option value="Import">Import</option>
          </select>

          {/* 清除过滤 */}
          {(search || status || mode) && (
            <button
              onClick={() => { setSearch(''); setStatus(''); setMode(''); }}
              style={{
                padding: '8px 14px', borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: '#fff5f5', color: C.red,
                cursor: 'pointer', fontSize: 13,
              }}
            >
              × 清除过滤
            </button>
          )}
        </div>

        {/* ── 状态过滤按钮（动态生成）──────────────────── */}
        {statusList.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16,
          }}>
            <button
              onClick={() => setStatus('')}
              style={{
                padding: '5px 14px', borderRadius: 20,
                border: `1px solid ${status === '' ? C.accent : C.border}`,
                background: status === '' ? C.accent : C.white,
                color: status === '' ? '#fff' : C.text,
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              全部
            </button>
            {statusList.map(s => (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                style={{
                  padding: '5px 14px', borderRadius: 20,
                  border: `2px solid ${statusColor(s)}`,
                  background: status === s ? statusColor(s) : C.white,
                  color: status === s ? '#fff' : statusColor(s),
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  transition: 'all .15s',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── 错误提示 ──────────────────────────────────── */}
        {error && (
          <div style={{
            background: '#fff2f0', border: `1px solid #ffccc7`,
            borderRadius: 8, padding: '12px 16px',
            color: C.red, marginBottom: 16, fontSize: 14,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* ── 数据表格 ──────────────────────────────────── */}
        <div style={{
          background: C.white, borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,.08)',
          overflow: 'auto',
        }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            fontSize: 13,
          }}>
            <thead>
              <tr style={{ background: C.primary, color: '#fff' }}>
                {['#', '案件番号', '顧客名', '案件テーマ', '状態', 'Mode', 'ETD', 'ETA', 'AWB NO'].map(h => (
                  <th key={h} style={{
                    padding: '10px 12px', textAlign: 'left',
                    fontWeight: 600, whiteSpace: 'nowrap',
                    borderRight: '1px solid rgba(255,255,255,.15)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr
                  key={r.$id.value}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: i % 2 === 0 ? C.white : '#f7faff',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.rowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? C.white : '#f7faff')}
                >
                  <td style={{ padding: '9px 12px', color: C.sub, minWidth: 40 }}>
                    {r.$id.value}
                  </td>
                  <td style={{ padding: '9px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {r.当社案件番号?.value || '—'}
                  </td>
                  <td style={{ padding: '9px 12px', minWidth: 120 }}>
                    {r.顧客名?.value || '—'}
                  </td>
                  <td style={{ padding: '9px 12px', minWidth: 160, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.案件テーマ?.value || '—'}
                  </td>
                  <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 10px', borderRadius: 12,
                      background: statusColor(r.操作ステータス?.value || '') + '22',
                      color: statusColor(r.操作ステータス?.value || ''),
                      fontWeight: 600, fontSize: 12,
                    }}>
                      {r.操作ステータス?.value || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '1px 8px', borderRadius: 4,
                      background: r.Mode?.value === 'Export' ? '#e6f4ff' : '#f6ffed',
                      color: r.Mode?.value === 'Export' ? C.accent : C.green,
                      fontSize: 12, fontWeight: 600,
                    }}>
                      {r.Mode?.value || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', color: C.sub }}>
                    {fmtDate(r.ETD?.value)}
                  </td>
                  <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', color: C.sub }}>
                    {fmtDate(r.ETA?.value)}
                  </td>
                  <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                    {r.AWB_NO?.value || '—'}
                  </td>
                </tr>
              ))}

              {/* 空状态 */}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={9} style={{
                    padding: '48px', textAlign: 'center',
                    color: C.sub, fontSize: 15,
                  }}>
                    {error ? '' : '没有找到符合条件的案件'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── 加载中 / 加载更多 ─────────────────────────── */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          {loading ? (
            <div style={{ color: C.sub, fontSize: 14 }}>
              <span style={{
                display: 'inline-block',
                width: 20, height: 20,
                border: `2px solid ${C.border}`,
                borderTopColor: C.accent,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                verticalAlign: 'middle', marginRight: 8,
              }} />
              正在加载...
            </div>
          ) : hasMore && records.length > 0 ? (
            <button
              onClick={loadMore}
              style={{
                padding: '10px 36px', borderRadius: 8,
                border: `1px solid ${C.accent}`,
                background: C.white, color: C.accent,
                fontSize: 14, cursor: 'pointer', fontWeight: 600,
              }}
            >
              加载更多
            </button>
          ) : records.length > 0 ? (
            <span style={{ color: C.sub, fontSize: 13 }}>
              — 已显示全部 {records.length} 件 —
            </span>
          ) : null}
        </div>

      </main>

      {/* 旋转动画 */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
