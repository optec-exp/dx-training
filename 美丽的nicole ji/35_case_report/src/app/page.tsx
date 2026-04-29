'use client';
import { useState, useMemo } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface TrackNode {
  id: number;
  time: string;
  location: string;
  status: string;
  note: string;
  photoUrl: string;
}

interface FeeItem {
  id: number;
  name: string;
  amount: string;
  currency: string;
}

interface ReportData {
  // 基本信息
  caseNo: string;
  customerName: string;
  customerContact: string;
  cargo: string;
  weight: string;
  pcs: string;
  route: string;
  flight: string;
  handler: string;
  handlerEmail: string;
  reportDate: string;
  // 踪迹
  nodes: TrackNode[];
  // 费用
  fees: FeeItem[];
  // 总结
  summary: string;
}

const INP: React.CSSProperties = {
  background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: 6,
  color: '#e2e8f0', padding: '8px 12px', width: '100%', fontSize: 13,
};

const TA: React.CSSProperties = { ...INP, resize: 'vertical', minHeight: 70 };

const LABEL: React.CSSProperties = { fontSize: 12, color: '#94a3b8', marginBottom: 4 };

const mkNode = (): TrackNode => ({
  id: Date.now() + Math.random(),
  time: '', location: '', status: '', note: '', photoUrl: '',
});

const mkFee = (): FeeItem => ({
  id: Date.now() + Math.random(),
  name: '', amount: '', currency: 'JPY',
});

// ── Preview HTML for print ────────────────────────────────────────────────────
function buildPrintHTML(d: ReportData): string {
  const feeRows = d.fees
    .filter(f => f.name)
    .map(f => `<tr><td>${f.name}</td><td style="text-align:right">${f.currency} ${f.amount}</td></tr>`)
    .join('');
  const total = d.fees
    .filter(f => f.currency === 'JPY' && f.amount)
    .reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);

  const nodeRows = d.nodes.filter(n => n.time || n.status).map(n => `
    <div style="display:flex;gap:12px;margin-bottom:14px">
      <div style="display:flex;flex-direction:column;align-items:center">
        <div style="width:36px;height:36px;border-radius:50%;background:#1e3a5f;display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid #3b82f6">✅</div>
        <div style="width:2px;flex:1;background:#1e3a5f;min-height:8px;margin:2px 0"></div>
      </div>
      <div style="flex:1;padding-top:4px">
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:4px">
          <span style="font-weight:700;color:#93c5fd">${n.status || '—'}</span>
          <span style="color:#64748b;font-size:12px">${n.time}</span>
          <span style="color:#64748b;font-size:12px">${n.location}</span>
        </div>
        ${n.note ? `<div style="color:#94a3b8;font-size:13px">${n.note}</div>` : ''}
        ${n.photoUrl ? `<div style="margin-top:8px"><img src="${n.photoUrl}" alt="货物照片" style="max-width:320px;max-height:200px;border-radius:6px;border:1px solid #1e3a5f" onerror="this.style.display='none'" /></div>` : ''}
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>案件汇报书 ${d.caseNo}</title>
  <style>
    body{font-family:'Segoe UI',sans-serif;background:#fff;color:#1e293b;margin:0;padding:32px}
    h1{font-size:22px;color:#0f172a;margin-bottom:4px}
    .sub{color:#64748b;font-size:13px;margin-bottom:24px}
    .section{margin-bottom:24px}
    .sec-title{font-weight:700;font-size:14px;color:#1e40af;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-bottom:14px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;font-size:13px}
    .kv label{color:#64748b;display:block;font-size:11px;margin-bottom:2px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    td,th{padding:8px 10px;border-bottom:1px solid #e2e8f0}
    th{background:#f1f5f9;font-weight:600}
    .total{font-weight:700;color:#1e40af}
    .summary{background:#f8fafc;border-radius:8px;padding:14px;font-size:13px;line-height:1.7;color:#334155}
    footer{margin-top:32px;text-align:center;font-size:12px;color:#94a3b8}
    @media print{body{padding:16px}}
  </style></head><body>
  <h1>📋 案件完结汇报书</h1>
  <div class="sub">OPTEC Express · 发送日期：${d.reportDate} · 案件号：${d.caseNo}</div>

  <div class="section">
    <div class="sec-title">基本信息</div>
    <div class="grid">
      <div class="kv"><label>客户名称</label>${d.customerName}</div>
      <div class="kv"><label>联系人</label>${d.customerContact}</div>
      <div class="kv"><label>货物名称</label>${d.cargo}</div>
      <div class="kv"><label>重量 / 件数</label>${d.weight} kg / ${d.pcs} 件</div>
      <div class="kv"><label>航线</label>${d.route}</div>
      <div class="kv"><label>航班号</label>${d.flight}</div>
      <div class="kv"><label>负责担当</label>${d.handler}</div>
      <div class="kv"><label>联系邮箱</label>${d.handlerEmail}</div>
    </div>
  </div>

  <div class="section">
    <div class="sec-title">货物踪迹</div>
    ${nodeRows || '<p style="color:#94a3b8;font-size:13px">（暂无踪迹记录）</p>'}
  </div>

  ${feeRows ? `
  <div class="section">
    <div class="sec-title">费用明细</div>
    <table>
      <thead><tr><th>项目</th><th style="text-align:right">金额</th></tr></thead>
      <tbody>${feeRows}
        ${total > 0 ? `<tr class="total"><td>合计（JPY）</td><td style="text-align:right">JPY ${total.toLocaleString()}</td></tr>` : ''}
      </tbody>
    </table>
  </div>` : ''}

  ${d.summary ? `
  <div class="section">
    <div class="sec-title">总结说明</div>
    <div class="summary">${d.summary}</div>
  </div>` : ''}

  <footer>OPTEC Express DX室 · ${d.handlerEmail || 'info@optec-exp.com'} · 本报告由系统自动生成</footer>
  </body></html>`;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const [d, setD] = useState<ReportData>({
    caseNo: '', customerName: '', customerContact: '',
    cargo: '', weight: '', pcs: '', route: '', flight: '',
    handler: '', handlerEmail: '', reportDate: today,
    nodes: [mkNode()],
    fees: [mkFee()],
    summary: '',
  });
  const [copied, setCopied] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const set = (k: keyof ReportData, v: ReportData[typeof k]) =>
    setD(p => ({ ...p, [k]: v }));

  // nodes
  const updateNode = (id: number, k: keyof TrackNode, v: string) =>
    setD(p => ({ ...p, nodes: p.nodes.map(n => n.id === id ? { ...n, [k]: v } : n) }));
  const addNode = () => setD(p => ({ ...p, nodes: [...p.nodes, mkNode()] }));
  const removeNode = (id: number) => setD(p => ({ ...p, nodes: p.nodes.filter(n => n.id !== id) }));

  // fees
  const updateFee = (id: number, k: keyof FeeItem, v: string) =>
    setD(p => ({ ...p, fees: p.fees.map(f => f.id === id ? { ...f, [k]: v } : f) }));
  const addFee = () => setD(p => ({ ...p, fees: [...p.fees, mkFee()] }));
  const removeFee = (id: number) => setD(p => ({ ...p, fees: p.fees.filter(f => f.id !== id) }));

  const totalJPY = useMemo(() =>
    d.fees.filter(f => f.currency === 'JPY' && f.amount).reduce((s, f) => s + (parseFloat(f.amount) || 0), 0),
    [d.fees],
  );

  const handlePrint = () => {
    const html = buildPrintHTML(d);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const handleCopyText = async () => {
    const lines: string[] = [];
    lines.push('【OPTEC Express　案件完结汇报書】');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`案件号：${d.caseNo}　发送日：${d.reportDate}`);
    lines.push(`客　户：${d.customerName}　联系人：${d.customerContact}`);
    lines.push(`货　物：${d.cargo}　${d.weight}kg / ${d.pcs}件`);
    lines.push(`航　线：${d.route}　航班：${d.flight}`);
    lines.push(`负责人：${d.handler}（${d.handlerEmail}）`);
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('【货物踪迹】');
    d.nodes.filter(n => n.time || n.status).forEach(n => {
      lines.push(`✅ ${n.status}  ${n.time}  ${n.location}`);
      if (n.note) lines.push(`   备注：${n.note}`);
      if (n.photoUrl) lines.push(`   照片：${n.photoUrl}`);
    });
    const validFees = d.fees.filter(f => f.name);
    if (validFees.length) {
      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━');
      lines.push('【费用明细】');
      validFees.forEach(f => lines.push(`${f.name}：${f.currency} ${f.amount}`));
      if (totalJPY > 0) lines.push(`合计（JPY）：${totalJPY.toLocaleString()}`);
    }
    if (d.summary) {
      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━');
      lines.push('【总结】');
      lines.push(d.summary);
    }
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('感谢您选择 OPTEC Express！');
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fieldRow = (label: string, value: string, key: keyof ReportData, placeholder = '') => (
    <div>
      <div style={LABEL}>{label}</div>
      <input style={INP} placeholder={placeholder} value={value}
        onChange={e => set(key, e.target.value)} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📋 案件汇报书生成</div>
          <div style={{ color: '#64748b', fontSize: 14 }}>货物踪迹 · 照片 · 费用 · OPTEC 主动生成发客户</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* ── LEFT: Form ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* 基本信息 */}
            <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 20, border: '1px solid #1e3a5f' }}>
              <div style={{ fontWeight: 600, color: '#93c5fd', marginBottom: 16 }}>📑 基本信息</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
                {fieldRow('案件号', d.caseNo, 'caseNo', 'OPT-2026-XXXX')}
                {fieldRow('发送日期', d.reportDate, 'reportDate', '2026-04-29')}
                {fieldRow('客户名称', d.customerName, 'customerName', '公司名称')}
                {fieldRow('联系人', d.customerContact, 'customerContact', '姓名')}
                {fieldRow('货物名称', d.cargo, 'cargo', '货物描述')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={LABEL}>重量 (kg)</div>
                    <input style={INP} placeholder="25" value={d.weight} onChange={e => set('weight', e.target.value)} />
                  </div>
                  <div>
                    <div style={LABEL}>件数</div>
                    <input style={INP} placeholder="3" value={d.pcs} onChange={e => set('pcs', e.target.value)} />
                  </div>
                </div>
                {fieldRow('航线', d.route, 'route', 'NRT → HKG')}
                {fieldRow('航班号', d.flight, 'flight', 'CX543')}
                {fieldRow('负责担当', d.handler, 'handler', '姓名')}
                {fieldRow('联系邮箱', d.handlerEmail, 'handlerEmail', 'xxx@optec-exp.com')}
              </div>
            </div>

            {/* 货物踪迹 */}
            <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 20, border: '1px solid #1e3a5f' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, color: '#93c5fd' }}>🗺️ 货物踪迹节点</div>
                <button
                  onClick={addNode}
                  style={{ padding: '5px 12px', borderRadius: 6, border: '1px dashed #1e3a5f', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 12 }}
                >
                  + 添加节点
                </button>
              </div>
              {d.nodes.map((n, i) => (
                <div key={n.id} style={{ background: '#020810', borderRadius: 8, padding: 14, marginBottom: 10, border: '1px solid #1e2537' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>节点 {i + 1}</span>
                    {d.nodes.length > 1 && (
                      <button onClick={() => removeNode(n.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <div style={LABEL}>时间</div>
                      <input style={INP} placeholder="2026-04-28 09:00" value={n.time}
                        onChange={e => updateNode(n.id, 'time', e.target.value)} />
                    </div>
                    <div>
                      <div style={LABEL}>地点</div>
                      <input style={INP} placeholder="成田空港 倉庫" value={n.location}
                        onChange={e => updateNode(n.id, 'location', e.target.value)} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={LABEL}>状态说明</div>
                    <input style={INP} placeholder="货物已收货入库" value={n.status}
                      onChange={e => updateNode(n.id, 'status', e.target.value)} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={LABEL}>备注</div>
                    <input style={INP} placeholder="可选备注" value={n.note}
                      onChange={e => updateNode(n.id, 'note', e.target.value)} />
                  </div>
                  <div>
                    <div style={LABEL}>货物照片 URL</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input style={{ ...INP, flex: 1 }}
                        placeholder="https://example.com/photo.jpg"
                        value={n.photoUrl}
                        onChange={e => updateNode(n.id, 'photoUrl', e.target.value)} />
                      {n.photoUrl && (
                        <button
                          onClick={() => setPreviewImg(n.photoUrl)}
                          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #1e3a5f', background: '#0d1b2e', color: '#93c5fd', cursor: 'pointer', fontSize: 12, flexShrink: 0 }}
                        >预览</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 费用明细 */}
            <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 20, border: '1px solid #1e3a5f' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, color: '#93c5fd' }}>💴 费用明细</div>
                <button
                  onClick={addFee}
                  style={{ padding: '5px 12px', borderRadius: 6, border: '1px dashed #1e3a5f', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 12 }}
                >
                  + 添加项目
                </button>
              </div>
              {d.fees.map(f => (
                <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 32px', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                  <div>
                    <div style={LABEL}>项目名称</div>
                    <input style={INP} placeholder="空运费" value={f.name}
                      onChange={e => updateFee(f.id, 'name', e.target.value)} />
                  </div>
                  <div>
                    <div style={LABEL}>金额</div>
                    <input style={INP} placeholder="50000" value={f.amount}
                      onChange={e => updateFee(f.id, 'amount', e.target.value)} />
                  </div>
                  <div>
                    <div style={LABEL}>币种</div>
                    <select
                      style={{ ...INP }}
                      value={f.currency}
                      onChange={e => updateFee(f.id, 'currency', e.target.value)}
                    >
                      {['JPY', 'USD', 'HKD', 'CNY', 'EUR'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <button onClick={() => removeFee(f.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, paddingTop: 20 }}>✕</button>
                </div>
              ))}
              {totalJPY > 0 && (
                <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#93c5fd', marginTop: 8, paddingTop: 8, borderTop: '1px solid #1e3a5f' }}>
                  合计（JPY）：¥{totalJPY.toLocaleString()}
                </div>
              )}
            </div>

            {/* 总结 */}
            <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 20, border: '1px solid #1e3a5f' }}>
              <div style={{ fontWeight: 600, color: '#93c5fd', marginBottom: 12 }}>📝 总结说明</div>
              <textarea style={TA} placeholder="案件总结、特别说明、感谢语等…"
                value={d.summary} onChange={e => set('summary', e.target.value)} />
            </div>
          </div>

          {/* ── RIGHT: Preview ───────────────────────────────────────────────── */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 20, border: '1px solid #1e3a5f' }}>
              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <button onClick={handleCopyText} style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: copied ? '#14532d' : '#1e40af', color: copied ? '#4ade80' : '#93c5fd',
                  fontSize: 13, fontWeight: 600, transition: 'all .2s',
                }}>{copied ? '✅ 已复制' : '📋 复制文本'}</button>
                <button onClick={handlePrint} style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: '#7c3aed', color: '#e9d5ff',
                  fontSize: 13, fontWeight: 600,
                }}>🖨️ 打印 / 导出</button>
              </div>

              {/* Preview card */}
              <div style={{
                background: '#020810', borderRadius: 10, padding: 18,
                border: '1px solid #1e3a5f', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto',
              }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>📋 案件完结汇报書</div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>
                  OPTEC Express · {d.reportDate} · {d.caseNo || '案件号待填'}
                </div>

                {/* Info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 12, marginBottom: 16 }}>
                  {[
                    ['客户', d.customerName], ['联系人', d.customerContact],
                    ['货物', d.cargo], ['重量/件数', `${d.weight}kg / ${d.pcs}件`],
                    ['航线', d.route], ['航班', d.flight],
                    ['负责人', d.handler], ['邮箱', d.handlerEmail],
                  ].map(([label, val]) => val ? (
                    <div key={label}>
                      <span style={{ color: '#64748b' }}>{label}：</span>
                      <span style={{ color: '#cbd5e1' }}>{val}</span>
                    </div>
                  ) : null)}
                </div>

                {/* Track nodes */}
                {d.nodes.some(n => n.time || n.status) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>货物踪迹</div>
                    {d.nodes.filter(n => n.time || n.status).map(n => (
                      <div key={n.id} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: '#14532d', border: '2px solid #22c55e',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
                          }}>✅</div>
                          <div style={{ width: 2, flex: 1, background: '#1e3a5f', minHeight: 8, margin: '2px 0' }} />
                        </div>
                        <div style={{ flex: 1, paddingTop: 2 }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0' }}>{n.status}</span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>{n.time}</span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>{n.location}</span>
                          </div>
                          {n.note && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{n.note}</div>}
                          {n.photoUrl && (
                            <img
                              src={n.photoUrl} alt="货物照片"
                              style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 6, border: '1px solid #1e3a5f', marginTop: 4, cursor: 'pointer' }}
                              onClick={() => setPreviewImg(n.photoUrl)}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fees */}
                {d.fees.some(f => f.name) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>费用明细</div>
                    {d.fees.filter(f => f.name).map(f => (
                      <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: '#94a3b8' }}>{f.name}</span>
                        <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{f.currency} {f.amount}</span>
                      </div>
                    ))}
                    {totalJPY > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: '1px solid #1e3a5f', color: '#93c5fd' }}>
                        <span>合计（JPY）</span>
                        <span>¥{totalJPY.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Summary */}
                {d.summary && (
                  <div style={{ background: '#0d1b2e', borderRadius: 8, padding: 12, fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>
                    {d.summary}
                  </div>
                )}

                <div style={{ marginTop: 16, fontSize: 11, color: '#475569', textAlign: 'center' }}>
                  感谢您选择 OPTEC Express！
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo preview modal */}
      {previewImg && (
        <div
          onClick={() => setPreviewImg(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, cursor: 'pointer',
          }}
        >
          <img src={previewImg} alt="预览" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10, border: '2px solid #1e3a5f' }} />
        </div>
      )}
    </div>
  );
}
