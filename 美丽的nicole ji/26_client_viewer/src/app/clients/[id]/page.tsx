'use client';

// ── 知识点：动态路由页面 ────────────────────────────────
// 文件路径：src/app/clients/[id]/page.tsx
// URL 模式：/clients/xxx  → params.id = "xxx"
//
// 方括号 [id] 是 Next.js 的"路由参数"语法
// 类似于：Express 里的 app.get('/clients/:id', ...)

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// ── 颜色常量 ──────────────────────────────────────────────
const C = {
  bg:      '#f0f4f8',
  white:   '#ffffff',
  primary: '#0050b3',
  accent:  '#1677ff',
  text:    '#1a1a2e',
  sub:     '#5a6a7a',
  border:  '#d0dae6',
  green:   '#389e0d',
  orange:  '#d46b08',
  red:     '#cf1322',
  gray:    '#8c8c8c',
};

// ── 类型定义 ──────────────────────────────────────────────
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

function statusColor(s: string): string {
  if (s.includes('処理中') || s.includes('进行中')) return C.orange;
  if (s.includes('完了') || s.includes('完成'))    return C.green;
  if (s.includes('確認') || s.includes('确认'))    return C.accent;
  if (s.includes('キャンセル') || s.includes('取消')) return C.red;
  return C.gray;
}

function fmtDate(s: string): string {
  if (!s) return '—';
  return s.slice(0, 10);
}

// ── 详情页 ───────────────────────────────────────────────
export default function ClientDetail() {
  // ── useParams：读取 URL 里的 [id] ──────────────────
  // 例如 URL 是 /clients/ABC%20Corp → id = "ABC%20Corp"
  const params     = useParams();
  const router     = useRouter();

  const rawId      = params.id as string;
  const clientName = decodeURIComponent(rawId);  // URL 解码

  const [records, setRecords] = useState<KintoneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // ── 用 [id] 请求该客户的案件列表 ─────────────────────
  useEffect(() => {
    if (!rawId) return;

    fetch(`/api/clients/${rawId}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) { setError(json.error); return; }
        setRecords(json.records ?? []);
      })
      .catch(() => setError('网络错误'))
      .finally(() => setLoading(false));
  }, [rawId]);

  // ── 统计数据 ─────────────────────────────────────────
  const total   = records.length;
  const modes   = { Export: 0, Import: 0 };
  records.forEach(r => {
    const m = r.Mode?.value;
    if (m === 'Export') modes.Export++;
    if (m === 'Import') modes.Import++;
  });

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>

      {/* 顶部标题栏 */}
      <header style={{
        background: C.primary, color: '#fff',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,.2)',
      }}>
        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          style={{
            background: 'rgba(255,255,255,.2)',
            border: 'none', color: '#fff',
            borderRadius: 6, padding: '4px 12px',
            cursor: 'pointer', fontSize: 14,
          }}
        >
          ← 返回
        </button>
        <span style={{ fontSize: 22 }}>🏢</span>
        <span style={{ fontSize: 17, fontWeight: 700 }}>{clientName}</span>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px' }}>

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
            <div>正在加载案件历史...</div>
          </div>
        )}

        {/* 错误 */}
        {error && (
          <div style={{
            background: '#fff2f0', border: '1px solid #ffccc7',
            borderRadius: 8, padding: '12px 16px', color: C.red,
          }}>
            ⚠ {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── 统计卡片 ─────────────────────────────── */}
            <div style={{
              display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap',
            }}>
              {[
                { label: '案件总数', value: total,         color: C.accent  },
                { label: 'Export',   value: modes.Export,  color: C.green   },
                { label: 'Import',   value: modes.Import,  color: C.orange  },
              ].map(s => (
                <div key={s.label} style={{
                  background: C.white, borderRadius: 10,
                  padding: '14px 24px', minWidth: 120,
                  boxShadow: '0 1px 4px rgba(0,0,0,.08)',
                  borderTop: `3px solid ${s.color}`,
                }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 13, color: C.sub }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── 案件历史表格 ─────────────────────────── */}
            {records.length === 0 ? (
              <div style={{
                background: C.white, borderRadius: 10,
                padding: 48, textAlign: 'center', color: C.sub,
              }}>
                该客户暂无案件记录
              </div>
            ) : (
              <div style={{
                background: C.white, borderRadius: 10,
                boxShadow: '0 1px 4px rgba(0,0,0,.08)',
                overflow: 'auto',
              }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse', fontSize: 13,
                }}>
                  <thead>
                    <tr style={{ background: C.primary, color: '#fff' }}>
                      {['#', '案件番号', '案件テーマ', '状態', 'Mode', 'ETD', 'ETA', 'AWB NO'].map(h => (
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
                        onMouseEnter={e => (e.currentTarget.style.background = '#eef4ff')}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? C.white : '#f7faff')}
                      >
                        <td style={{ padding: '9px 12px', color: C.sub }}>{r.$id.value}</td>
                        <td style={{ padding: '9px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {r.当社案件番号?.value || '—'}
                        </td>
                        <td style={{ padding: '9px 12px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                        <td style={{ padding: '9px 12px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          {r.AWB_NO?.value || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
