'use client';
import { useState, useMemo, useEffect } from 'react';

type MType = 'weekly' | 'client' | 'project' | 'daily' | 'training';
type Lang  = 'zh' | 'ja' | 'en';

interface AItem { id: number; name: string; dur: number; owner: string; }
type DefItem = Omit<AItem, 'id'>;

const TYPES: { key: MType; emoji: string; zh: string; ja: string; en: string; defaults: DefItem[] }[] = [
  { key: 'weekly',   emoji: '📋', zh: '周例会',    ja: '週次ミーティング', en: 'Weekly Meeting',   defaults: [
    { name: '上周工作回顾', dur: 15, owner: '全员'   },
    { name: '本周工作计划', dur: 25, owner: '各担当' },
    { name: '问题讨论',    dur: 15, owner: '全员'   },
    { name: '待办事项确认', dur: 5,  owner: '主持人' },
  ]},
  { key: 'client',   emoji: '🤝', zh: '客户对接会', ja: 'お客様打合せ',    en: 'Client Meeting',   defaults: [
    { name: '自我介绍',   dur: 5,  owner: '全员'   },
    { name: '议题说明',   dur: 20, owner: '担当者' },
    { name: '问答环节',   dur: 20, owner: '全员'   },
    { name: '下一步计划', dur: 10, owner: '担当者' },
    { name: '结语确认',   dur: 5,  owner: '主持人' },
  ]},
  { key: 'project',  emoji: '📊', zh: '项目汇报',   ja: 'プロジェクト報告', en: 'Project Review',   defaults: [
    { name: '项目现状报告', dur: 15, owner: 'PM'   },
    { name: '进度确认',    dur: 15, owner: '全员'  },
    { name: '问题·风险',   dur: 15, owner: 'PM'   },
    { name: '决议事项',    dur: 10, owner: '全员'  },
    { name: '下次汇报日期', dur: 5,  owner: 'PM'   },
  ]},
  { key: 'daily',    emoji: '🌅', zh: '每日分享',   ja: 'デイリーシェア',  en: 'Daily Standup',    defaults: [
    { name: '昨日工作汇报',   dur: 10, owner: '全员' },
    { name: '本日工作计划',   dur: 10, owner: '全员' },
    { name: '障碍·需要支援', dur: 5,  owner: '全员' },
  ]},
  { key: 'training', emoji: '📚', zh: '教育培训',   ja: '教育研修',        en: 'Training Session', defaults: [
    { name: '开场介绍',   dur: 5,  owner: '讲师' },
    { name: '内容讲解',   dur: 40, owner: '讲师' },
    { name: '实习演练',   dur: 20, owner: '全员' },
    { name: 'Q & A',     dur: 10, owner: '全员' },
    { name: '小结总评',   dur: 5,  owner: '讲师' },
  ]},
];

const LBL: Record<Lang, { date: string; time: string; to: string; loc: string; chair: string; att: string; agd: string; owner: string; notes: string; by: string; total: string; min: string }> = {
  zh: { date: '日期', time: '时间', to: ' 至 ', loc: '地点', chair: '主持人', att: '参加者', agd: '议程内容', owner: '担当', notes: '备注', by: '制作', total: '合计', min: '分' },
  ja: { date: '日時', time: '時間', to: '〜',   loc: '場所', chair: '司会',   att: '参加者', agd: 'アジェンダ', owner: '担当', notes: '備考', by: '作成者', total: '合計', min: '分' },
  en: { date: 'Date', time: 'Time', to: ' - ',  loc: 'Venue',chair: 'Chair', att: 'Attendees',agd: 'AGENDA',   owner: 'Owner',notes: 'Notes', by: 'Prepared by', total: 'Total', min: 'min' },
};

const DOW_ZH = ['日','一','二','三','四','五','六'];
const DOW_JA = ['日','月','火','水','木','金','土'];
const DOW_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MON_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmtDate(s: string, lang: Lang): string {
  if (!s) return '';
  const d = new Date(s + 'T00:00:00');
  const y = d.getFullYear(), mo = d.getMonth() + 1, dd = d.getDate(), dw = d.getDay();
  if (lang === 'zh') return `${y}年${mo}月${dd}日（周${DOW_ZH[dw]}）`;
  if (lang === 'ja') return `${y}年${mo}月${dd}日（${DOW_JA[dw]}）`;
  return `${DOW_EN[dw]}, ${MON_EN[d.getMonth()]} ${dd}, ${y}`;
}

function addMin(t: string, m: number): string {
  const [h, mm] = t.split(':').map(Number);
  const tot = h * 60 + mm + m;
  return `${String(Math.floor(tot / 60) % 24).padStart(2,'0')}:${String(tot % 60).padStart(2,'0')}`;
}

function generate(
  mtype: MType, lang: Lang, items: AItem[],
  date: string, startTime: string, location: string,
  organizer: string, attendees: string, notes: string,
): string {
  const t  = TYPES.find(x => x.key === mtype)!;
  const L  = LBL[lang];
  const title  = t[lang];
  const total  = items.reduce((s, i) => s + i.dur, 0);
  const endTime = addMin(startTime, total);
  const SEP  = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  const SEP2 = '──────────────────────────────';
  const lines: string[] = [];

  lines.push(`【${title} ${L.agd}】`);
  lines.push(SEP);
  if (date)      lines.push(`${L.date.padEnd(4)}：${fmtDate(date, lang)}`);
  lines.push(`${L.time.padEnd(4)}：${startTime}${L.to}${endTime}`);
  if (location)  lines.push(`${L.loc.padEnd(4)}：${location}`);
  if (organizer) lines.push(`${L.chair.padEnd(3)}：${organizer}`);
  if (attendees) lines.push(`${L.att.padEnd(3)}：${attendees}`);
  lines.push('');
  lines.push(SEP);
  lines.push(`  ${L.agd}`);
  lines.push(SEP);

  let cur = startTime;
  items.forEach((item, idx) => {
    const end = addMin(cur, item.dur);
    const slot = `${cur}${L.to}${end}`;
    const dur  = `${item.dur}${L.min}`;
    lines.push(`  ${String(idx + 1).padStart(2)}. ${item.name}`);
    lines.push(`        ${slot}  ${dur}  ${L.owner}：${item.owner}`);
    lines.push('');
    cur = end;
  });

  lines.push(SEP2);
  lines.push(`  ${L.total}：${total} ${L.min}`);

  if (notes) {
    lines.push('');
    lines.push(SEP);
    lines.push(`  ${L.notes}`);
    lines.push(SEP);
    lines.push(`  ${notes}`);
  }

  lines.push('');
  if (organizer) lines.push(`${L.by}：${organizer}`);

  return lines.join('\n');
}

function makePrintHTML(text: string, title: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>body{font-family:"MS Gothic","Hiragino Gothic",monospace;font-size:12px;color:#000;background:#fff;padding:15mm 20mm;line-height:2;}pre{white-space:pre-wrap;word-break:break-word;}@media print{body{padding:0;}@page{margin:15mm;}}</style>
</head><body><pre>${escaped}</pre></body></html>`;
}

function todayStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}

export default function Page() {
  const [mtype,     setMtype]     = useState<MType>('weekly');
  const [lang,      setLang]      = useState<Lang>('zh');
  const [date,      setDate]      = useState<string>(todayStr);
  const [startTime, setStartTime] = useState('10:00');
  const [location,  setLocation]  = useState('');
  const [organizer, setOrganizer] = useState('');
  const [attendees, setAttendees] = useState('');
  const [items,     setItems]     = useState<AItem[]>(() =>
    TYPES[0].defaults.map((d, i) => ({ ...d, id: i + 1 }))
  );
  const [notes,  setNotes]  = useState('');
  const [copied, setCopied] = useState(false);

  // 切换会议类型时重置议程项目
  useEffect(() => {
    const t = TYPES.find(x => x.key === mtype)!;
    setItems(t.defaults.map((d, i) => ({ ...d, id: Date.now() + i })));
  }, [mtype]);

  const addItem  = () =>
    setItems(p => [...p, { id: Date.now(), name: '', dur: 10, owner: '' }]);
  const rmItem   = (id: number) =>
    setItems(p => p.filter(a => a.id !== id));
  const upItem   = (id: number, f: 'name' | 'owner', v: string) =>
    setItems(p => p.map(a => a.id === id ? { ...a, [f]: v } : a));
  const upDur    = (id: number, v: number) =>
    setItems(p => p.map(a => a.id === id ? { ...a, dur: Math.max(1, v) } : a));

  const output = useMemo(() =>
    generate(mtype, lang, items, date, startTime, location, organizer, attendees, notes),
    [mtype, lang, items, date, startTime, location, organizer, attendees, notes]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    const t = TYPES.find(x => x.key === mtype)!;
    const html = makePrintHTML(output, t[lang]);
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const IS: React.CSSProperties = {
    background: '#1e293b', border: '1px solid #334155', borderRadius: '6px',
    color: '#e2e8f0', padding: '7px 10px', fontSize: '13px', outline: 'none',
  };
  const SEC: React.CSSProperties = {
    background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px 16px',
  };
  const LBLstyle: React.CSSProperties = {
    fontSize: '10px', color: '#64748b', fontWeight: 700,
    letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '10px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#030b18', color: '#e2e8f0', fontFamily: 'system-ui,"Segoe UI",sans-serif', padding: '24px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#38bdf8', margin: 0 }}>
          📋 OPTEC 会议议程模板生成器
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>
          5种会议类型 · 中文 / 日本語 / English · 一键复制 · 打印格式
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* ════ LEFT ════ */}
        <div style={{ width: '44%', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Meeting type */}
          <div style={SEC}>
            <div style={LBLstyle}>会议类型</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {TYPES.map(t => (
                <button key={t.key} onClick={() => setMtype(t.key)} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left',
                  padding: '9px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                  background: mtype === t.key ? '#0c2240' : '#1e293b',
                  border:     `1px solid ${mtype === t.key ? '#0ea5e9' : '#334155'}`,
                  color:      mtype === t.key ? '#7dd3fc' : '#94a3b8',
                }}>
                  <span style={{ fontSize: '17px' }}>{t.emoji}</span>
                  <span>{t.zh}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.5 }}>{t.en}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div style={SEC}>
            <div style={LBLstyle}>出力言語 / 输出语言</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {([['zh','中文'],['ja','日本語'],['en','English']] as [Lang,string][]).map(([l, lbl]) => (
                <button key={l} onClick={() => setLang(l)} style={{
                  flex: 1, padding: '9px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                  background: lang === l ? '#0c2240' : '#1e293b',
                  border:     `1px solid ${lang === l ? '#0ea5e9' : '#334155'}`,
                  color:      lang === l ? '#7dd3fc' : '#64748b',
                }}>{lbl}</button>
              ))}
            </div>
          </div>

          {/* Meeting info */}
          <div style={SEC}>
            <div style={LBLstyle}>会议信息</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {[
                { label: '日期',   el: <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...IS, flex: 1 }} /> },
                { label: '开始时间', el: <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ ...IS, width: '110px' }} /> },
                { label: '地点',   el: <input value={location} onChange={e => setLocation(e.target.value)} placeholder="会议室A / Online" style={{ ...IS, flex: 1 }} /> },
                { label: '主持人', el: <input value={organizer} onChange={e => setOrganizer(e.target.value)} placeholder="田中 美麗" style={{ ...IS, flex: 1 }} /> },
                { label: '参加者', el: <input value={attendees} onChange={e => setAttendees(e.target.value)} placeholder="A, B, C" style={{ ...IS, flex: 1 }} /> },
              ].map(({ label, el }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', width: '56px', flexShrink: 0 }}>{label}</span>
                  {el}
                </div>
              ))}
            </div>
          </div>

          {/* Agenda items */}
          <div style={SEC}>
            <div style={LBLstyle}>议程项目</div>
            <div style={{ display: 'flex', fontSize: '10px', color: '#475569', gap: '6px', paddingLeft: '20px', marginBottom: '7px' }}>
              <span style={{ flex: 1 }}>项目名称</span>
              <span style={{ width: '48px', textAlign: 'center' }}>分钟</span>
              <span style={{ width: '76px' }}>担当</span>
              <span style={{ width: '20px' }}></span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {items.map((item, idx) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#475569', width: '16px', flexShrink: 0 }}>{idx+1}.</span>
                  <input value={item.name} onChange={e => upItem(item.id, 'name', e.target.value)}
                    style={{ ...IS, flex: 1, fontSize: '12px', padding: '5px 8px' }} />
                  <input type="number" min="1" max="180" value={item.dur} onChange={e => upDur(item.id, parseInt(e.target.value) || 1)}
                    style={{ ...IS, width: '48px', fontSize: '12px', padding: '5px 4px', textAlign: 'center' }} />
                  <input value={item.owner} onChange={e => upItem(item.id, 'owner', e.target.value)}
                    style={{ ...IS, width: '74px', fontSize: '12px', padding: '5px 6px' }} />
                  <button onClick={() => rmItem(item.id)}
                    style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '16px', padding: '0', lineHeight: '1' }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <button onClick={addItem} style={{
                fontSize: '12px', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer',
                background: '#1e293b', border: '1px dashed #475569', color: '#64748b',
              }}>+ 追加项目</button>
              <span style={{ fontSize: '12px', color: '#475569' }}>
                合计：{items.reduce((s, i) => s + i.dur, 0)} 分
              </span>
            </div>
          </div>

          {/* Notes */}
          <div style={SEC}>
            <div style={LBLstyle}>备注 / Notes</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="如：请提前准备上周工作报告。Please prepare last week's report."
              style={{ ...IS, width: '100%', resize: 'vertical', lineHeight: '1.6' }}
            />
          </div>
        </div>

        {/* ════ RIGHT ════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', top: '24px' }}>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleCopy} style={{
              flex: 1, padding: '11px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '14px',
              background: copied ? '#064e3b' : '#0369a1',
              border:     `1px solid ${copied ? '#10b981' : '#0ea5e9'}`,
              color:      copied ? '#6ee7b7' : '#7dd3fc',
              transition: 'all 0.2s',
            }}>
              {copied ? '✅ 已复制！' : '📋 一键复制文字'}
            </button>
            <button onClick={handlePrint} style={{
              flex: 1, padding: '11px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '14px',
              background: '#1a1200', border: '1px solid #f59e0b55', color: '#f59e0b',
            }}>
              🖨️ 打印格式
            </button>
          </div>

          {/* Preview */}
          <div style={{ background: '#060d18', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '11px', color: '#334155', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span>预览 · プレビュー · Preview</span>
              <span style={{ color: '#1e4080' }}>实时生成</span>
            </div>
            <pre style={{
              fontFamily: '"MS Gothic","Consolas","Courier New",monospace',
              fontSize: '12px', lineHeight: '1.9', color: '#cbd5e1',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              maxHeight: '70vh', overflowY: 'auto',
            }}>
              {output}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
