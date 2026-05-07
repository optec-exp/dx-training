'use client';

import { useState } from 'react';

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
  $id:            { value: string };
  当社案件番号:   { value: string };
  顧客名:         { value: string };
  案件テーマ:     { value: string };
  操作ステータス: { value: string };
  Mode:           { value: string };
  ETD:            { value: string };
  ETA:            { value: string };
  AWB_NO:         { value: string };
  作成日時:       { value: string };
}

function statusColor(s: string): string {
  if (s.includes('処理中') || s.includes('进行中')) return C.orange;
  if (s.includes('完了') || s.includes('完成'))    return C.green;
  if (s.includes('確認') || s.includes('确认'))    return C.accent;
  if (s.includes('キャンセル'))                    return C.red;
  return C.gray;
}

// ── 核心知识点：CSV 导出 ───────────────────────────────
// Blob = 二进制数据对象（可以理解为"内存里的文件"）
// URL.createObjectURL = 把内存里的文件变成可下载的 URL
// 点击隐藏的 <a> 标签触发下载
function exportCSV(records: KintoneRecord[]) {
  // 1. 表头
  const header = ['ID', '案件番号', '顧客名', '案件テーマ', '状態', 'Mode', 'ETD', 'ETA', 'AWB NO'];

  // 2. 每一行数据
  const rows = records.map(r => [
    r.$id.value,
    r.当社案件番号?.value  ?? '',
    r.顧客名?.value        ?? '',
    r.案件テーマ?.value    ?? '',
    r.操作ステータス?.value ?? '',
    r.Mode?.value          ?? '',
    r.ETD?.value           ?? '',
    r.ETA?.value           ?? '',
    r.AWB_NO?.value        ?? '',
  ]);

  // 3. 拼成 CSV 字符串
  // 如果内容里有逗号或双引号，要用双引号包起来
  const escape = (v: string) =>
    v.includes(',') || v.includes('"') || v.includes('\n')
      ? `"${v.replace(/"/g, '""')}"`
      : v;

  const csv = [header, ...rows]
    .map(row => row.map(escape).join(','))
    .join('\n');

  // 4. 创建 Blob（加 BOM 让 Excel 正确识别中文）
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });

  // 5. 创建临时下载链接并点击
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = `AWB実績_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  // 6. 释放临时 URL（避免内存泄漏）
  URL.revokeObjectURL(url);
}

// ── 主页面 ───────────────────────────────────────────────
export default function Home() {
  // 搜索条件
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [customer, setCustomer] = useState('');
  const [status,   setStatus]   = useState('');
  const [mode,     setMode]     = useState('');
  const [awb,      setAwb]      = useState('');

  // 结果
  const [records, setRecords] = useState<KintoneRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [searched, setSearched] = useState(false);  // 是否已经搜索过

  // ── 搜索 ───────────────────────────────────────────────
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSearched(true);

    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo)   params.set('dateTo',   dateTo);
    if (customer) params.set('customer', customer);
    if (status)   params.set('status',   status);
    if (mode)     params.set('mode',     mode);
    if (awb)      params.set('awb',      awb);

    try {
      const res  = await fetch(`/api/awb?${params}`);
      const json = await res.json();
      if (json.error) { setError(json.error); setRecords([]); }
      else setRecords(json.records ?? []);
    } catch {
      setError('网络请求失败');
      setRecords([]);
    }

    setLoading(false);
  };

  // ── 清除 ───────────────────────────────────────────────
  const handleClear = () => {
    setDateFrom(''); setDateTo('');
    setCustomer(''); setStatus('');
    setMode('');     setAwb('');
    setRecords([]);  setSearched(false);
    setError(null);
  };

  // 输入框公共样式
  const inputStyle: React.CSSProperties = {
    padding: '8px 10px', borderRadius: 6,
    border: `1px solid ${C.border}`, fontSize: 13,
    background: C.white, outline: 'none', width: '100%',
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>

      {/* 顶部标题栏 */}
      <header style={{
        background: C.primary, color: '#fff',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,.2)',
      }}>
        <span style={{ fontSize: 22 }}>✈</span>
        <span style={{ fontSize: 18, fontWeight: 700 }}>AWB 実績搜索</span>
        {records.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 13, opacity: .85 }}>
            找到 {records.length} 件
          </span>
        )}
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── 搜索条件栏 ─────────────────────────────── */}
        <div style={{
          background: C.white, borderRadius: 10,
          padding: '18px 20px', marginBottom: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,.08)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12, marginBottom: 14,
          }}>

            {/* ETD 期间 開始 */}
            <div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>ETD 开始日期</div>
              <input type="date" value={dateFrom}
                onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
            </div>

            {/* ETD 期间 終了 */}
            <div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>ETD 结束日期</div>
              <input type="date" value={dateTo}
                onChange={e => setDateTo(e.target.value)} style={inputStyle} />
            </div>

            {/* 顧客名 */}
            <div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>顧客名</div>
              <input type="text" placeholder="客户名关键词" value={customer}
                onChange={e => setCustomer(e.target.value)} style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            </div>

            {/* AWB番号 */}
            <div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>AWB 番号</div>
              <input type="text" placeholder="AWB番号关键词" value={awb}
                onChange={e => setAwb(e.target.value)} style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            </div>

            {/* Mode */}
            <div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>Mode</div>
              <select value={mode} onChange={e => setMode(e.target.value)} style={inputStyle}>
                <option value="">全部</option>
                <option value="Export">Export</option>
                <option value="Import">Import</option>
              </select>
            </div>

            {/* 状態 */}
            <div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>状態</div>
              <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                <option value="">全部</option>
                <option value="◆処理中">◆処理中</option>
                <option value="●完了">●完了</option>
                <option value="▲要確認">▲要確認</option>
                <option value="×キャンセル">×キャンセル</option>
              </select>
            </div>
          </div>

          {/* 按钮区 */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                padding: '9px 28px', borderRadius: 7,
                background: C.accent, color: '#fff', border: 'none',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                opacity: loading ? .6 : 1,
              }}
            >
              {loading ? '搜索中...' : '🔍 搜索'}
            </button>
            <button
              onClick={handleClear}
              style={{
                padding: '9px 20px', borderRadius: 7,
                background: C.white, color: C.sub,
                border: `1px solid ${C.border}`,
                fontSize: 14, cursor: 'pointer',
              }}
            >
              清除
            </button>

            {/* ── CSV 导出按钮 ───────────────────────── */}
            {records.length > 0 && (
              <button
                onClick={() => exportCSV(records)}
                style={{
                  marginLeft: 'auto',
                  padding: '9px 20px', borderRadius: 7,
                  background: C.green, color: '#fff', border: 'none',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                ↓ 导出 CSV ({records.length} 件)
              </button>
            )}
          </div>
        </div>

        {/* 错误 */}
        {error && (
          <div style={{
            background: '#fff2f0', border: '1px solid #ffccc7',
            borderRadius: 8, padding: '12px 16px', color: C.red, marginBottom: 16,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: C.sub }}>
            <div style={{
              display: 'inline-block', width: 28, height: 28,
              border: `3px solid ${C.border}`, borderTopColor: C.accent,
              borderRadius: '50%', animation: 'spin .8s linear infinite',
              marginBottom: 10,
            }} />
            <div>搜索中...</div>
          </div>
        )}

        {/* ── 搜索结果表格 ─────────────────────────────── */}
        {!loading && searched && (
          records.length === 0 ? (
            <div style={{
              background: C.white, borderRadius: 10, padding: 48,
              textAlign: 'center', color: C.sub,
              boxShadow: '0 1px 4px rgba(0,0,0,.08)',
            }}>
              没有找到符合条件的记录
            </div>
          ) : (
            <div style={{
              background: C.white, borderRadius: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,.08)',
              overflow: 'auto',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.primary, color: '#fff' }}>
                    {['#', '案件番号', '顧客名', '案件テーマ', '状態', 'Mode', 'ETD', 'ETA', 'AWB NO'].map(h => (
                      <th key={h} style={{
                        padding: '10px 12px', textAlign: 'left',
                        fontWeight: 600, whiteSpace: 'nowrap',
                        borderRight: '1px solid rgba(255,255,255,.15)',
                      }}>{h}</th>
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
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        {r.顧客名?.value || '—'}
                      </td>
                      <td style={{
                        padding: '9px 12px', maxWidth: 200,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {r.案件テーマ?.value || '—'}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: 12,
                          background: statusColor(r.操作ステータス?.value || '') + '22',
                          color: statusColor(r.操作ステータス?.value || ''),
                          fontWeight: 600, fontSize: 12,
                        }}>
                          {r.操作ステータス?.value || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '1px 8px', borderRadius: 4,
                          background: r.Mode?.value === 'Export' ? '#e6f4ff' : '#f6ffed',
                          color: r.Mode?.value === 'Export' ? C.accent : C.green,
                          fontSize: 12, fontWeight: 600,
                        }}>
                          {r.Mode?.value || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', color: C.sub }}>
                        {r.ETD?.value || '—'}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', color: C.sub }}>
                        {r.ETA?.value || '—'}
                      </td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {r.AWB_NO?.value || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* 初始提示 */}
        {!loading && !searched && (
          <div style={{
            background: C.white, borderRadius: 10,
            padding: 48, textAlign: 'center', color: C.sub,
            boxShadow: '0 1px 4px rgba(0,0,0,.08)',
          }}>
            请输入搜索条件后点击「搜索」
          </div>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
