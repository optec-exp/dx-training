'use client';
import { useState, useMemo, useEffect } from 'react';

type Lang = 'zh' | 'ja' | 'en';
interface Topic    { id: number; title: string; discussion: string; }
interface Decision { id: number; content: string; }
interface Action   { id: number; task: string; assignee: string; deadline: string; }

const TYPES = [
  { key: 'weekly',   zh: '周例会',     ja: '週次定例',              en: 'Weekly Meeting'   },
  { key: 'client',   zh: '客户对接会', ja: '顧客対応会議',           en: 'Client Meeting'   },
  { key: 'project',  zh: '项目汇报',   ja: 'プロジェクト報告',       en: 'Project Review'   },
  { key: 'daily',    zh: '每日分享',   ja: 'デイリースタンドアップ', en: 'Daily Standup'    },
  { key: 'training', zh: '教育培训',   ja: '教育研修',               en: 'Training Session' },
] as const;
type TKey = typeof TYPES[number]['key'];

const DEFAULT_TOPICS: Record<TKey, { title: string; discussion: string }[]> = {
  weekly:   [{ title:'上周进度回顾', discussion:'' }, { title:'本周计划与目标', discussion:'' }, { title:'问题与讨论', discussion:'' }],
  client:   [{ title:'客户需求确认', discussion:'' }, { title:'方案说明与讨论', discussion:'' }, { title:'下一步行动', discussion:'' }],
  project:  [{ title:'项目进度报告', discussion:'' }, { title:'风险与问题',     discussion:'' }, { title:'里程碑确认', discussion:'' }],
  daily:    [{ title:'今日完成内容', discussion:'' }, { title:'今日计划',       discussion:'' }, { title:'阻碍事项',   discussion:'' }],
  training: [{ title:'培训主题说明', discussion:'' }, { title:'内容讲解',       discussion:'' }, { title:'Q&A',        discussion:'' }],
};

const LBL: Record<Lang, Record<string, string>> = {
  zh: {
    pageTitle:'会议记录', subtitle:'OPTEC Express · 会议记录生成工具',
    basic:'基本信息', date:'日期', startTime:'开始时间', endTime:'结束时间',
    location:'地点', chair:'主持人', recorder:'记录人',
    attendees:'出席者', absentees:'缺席者',
    topicSec:'议题与讨论', topicLabel:'议题', discussLabel:'讨论内容',
    decisionSec:'决议事项',
    actionSec:'行动事项', taskLabel:'任务内容', assigneeLabel:'负责人', deadlineLabel:'截止日期',
    nextSec:'下次会议安排', notesSec:'备注',
    addTopic:'+ 添加议题', addDecision:'+ 添加决议', addAction:'+ 添加行动事项',
    copy:'复制文字', copied:'已复制！', print:'打印',
    preview:'预览',
    locationPh:'例：会议室A',  absenteesPh:'如无请留空',
  },
  ja: {
    pageTitle:'議事録', subtitle:'OPTEC Express · 議事録作成ツール',
    basic:'基本情報', date:'日付', startTime:'開始時間', endTime:'終了時間',
    location:'場所', chair:'司会', recorder:'書記',
    attendees:'出席者', absentees:'欠席者',
    topicSec:'議題・討議', topicLabel:'議題', discussLabel:'討議内容',
    decisionSec:'決議事項',
    actionSec:'アクションアイテム', taskLabel:'タスク', assigneeLabel:'担当者', deadlineLabel:'期限',
    nextSec:'次回会議', notesSec:'備考',
    addTopic:'+ 議題を追加', addDecision:'+ 決議を追加', addAction:'+ アクションを追加',
    copy:'コピー', copied:'コピー済！', print:'印刷',
    preview:'プレビュー',
    locationPh:'例：会議室A', absenteesPh:'なければ空白',
  },
  en: {
    pageTitle:'Meeting Minutes', subtitle:'OPTEC Express · Minutes Generator',
    basic:'Basic Information', date:'Date', startTime:'Start Time', endTime:'End Time',
    location:'Location', chair:'Chairperson', recorder:'Recorder',
    attendees:'Attendees', absentees:'Absent',
    topicSec:'Topics & Discussion', topicLabel:'Topic', discussLabel:'Discussion',
    decisionSec:'Decisions',
    actionSec:'Action Items', taskLabel:'Task', assigneeLabel:'Assignee', deadlineLabel:'Due Date',
    nextSec:'Next Meeting', notesSec:'Notes',
    addTopic:'+ Add Topic', addDecision:'+ Add Decision', addAction:'+ Add Action',
    copy:'Copy Text', copied:'Copied!', print:'Print',
    preview:'Preview',
    locationPh:'e.g. Meeting Room A', absenteesPh:'Leave blank if none',
  },
};

// ── output generator ──────────────────────────────────────────────────────────
function generate(p: {
  mtype: TKey; lang: Lang; date: string; startTime: string; endTime: string;
  location: string; chair: string; recorder: string; attendees: string; absentees: string;
  topics: Topic[]; decisions: Decision[]; actions: Action[];
  nextMeeting: string; notes: string;
}): string {
  const l = LBL[p.lang];
  const t = TYPES.find(x => x.key === p.mtype)!;
  const SEP = '━━━━━━━━━━━━━━━━━━━━━━━━';
  const H = (s: string) => `■ ${s}`;
  const lines: string[] = [];

  lines.push(`【${t[p.lang]}　${l.pageTitle}】`);
  lines.push('');
  lines.push(H(l.basic));
  lines.push(`${l.date}：${p.date || '　　　　'}`);
  const timeStr = p.startTime && p.endTime
    ? `${p.startTime} ～ ${p.endTime}`
    : (p.startTime || p.endTime || '');
  if (timeStr) lines.push(`${l.startTime.replace('开始', '').replace('開始', '').replace('Start ', '')}${p.lang === 'en' ? 'Time' : '時間'}：${timeStr}`);
  if (p.location)  lines.push(`${l.location}：${p.location}`);
  if (p.chair)     lines.push(`${l.chair}：${p.chair}`);
  if (p.recorder)  lines.push(`${l.recorder}：${p.recorder}`);
  if (p.attendees) lines.push(`${l.attendees}：${p.attendees}`);
  if (p.absentees) lines.push(`${l.absentees}：${p.absentees}`);

  const activeTopics = p.topics.filter(t => t.title || t.discussion);
  if (activeTopics.length > 0) {
    lines.push(''); lines.push(SEP); lines.push('');
    lines.push(H(l.topicSec));
    p.topics.forEach((tp, i) => {
      if (!tp.title && !tp.discussion) return;
      lines.push('');
      lines.push(`【${l.topicLabel}${i + 1}】${tp.title}`);
      if (tp.discussion) {
        lines.push(`${l.discussLabel}：`);
        tp.discussion.split('\n').forEach(line => lines.push(`　${line}`));
      }
    });
  }

  const activeDec = p.decisions.filter(d => d.content);
  if (activeDec.length > 0) {
    lines.push(''); lines.push(SEP); lines.push('');
    lines.push(H(l.decisionSec));
    let n = 1;
    p.decisions.forEach(d => { if (d.content) lines.push(`No.${n++}　${d.content}`); });
  }

  const activeAct = p.actions.filter(a => a.task);
  if (activeAct.length > 0) {
    lines.push(''); lines.push(SEP); lines.push('');
    lines.push(H(l.actionSec));
    let n = 1;
    p.actions.forEach(a => {
      if (!a.task) return;
      const parts = [`No.${n++}`, a.task];
      if (a.assignee) parts.push(`${l.assigneeLabel}：${a.assignee}`);
      if (a.deadline) parts.push(`${l.deadlineLabel}：${a.deadline}`);
      lines.push(parts.join('  |  '));
    });
  }

  if (p.nextMeeting || p.notes) {
    lines.push(''); lines.push(SEP);
    if (p.nextMeeting) { lines.push(''); lines.push(H(l.nextSec)); lines.push(p.nextMeeting); }
    if (p.notes)       { lines.push(''); lines.push(H(l.notesSec)); lines.push(p.notes); }
  }

  return lines.join('\n');
}

function printHTML(text: string, title: string): string {
  const esc = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:'Noto Sans CJK SC',system-ui,sans-serif;font-size:13px;line-height:1.9;color:#111;padding:32px 40px;max-width:740px;margin:0 auto}pre{white-space:pre-wrap;word-break:break-word}@page{margin:20mm}</style>
</head><body><pre>${esc}</pre></body></html>`;
}

// ── shared input styles ───────────────────────────────────────────────────────
const INP: React.CSSProperties = {
  width: '100%', padding: '7px 10px', background: '#07111d',
  border: '1px solid #1e3a5f', borderRadius: 6, color: '#e2e8f0',
  fontSize: 13, outline: 'none',
};
const TA: React.CSSProperties = { ...INP, resize: 'vertical' };
const LBL_S: React.CSSProperties = { fontSize: 12, color: '#475569', marginBottom: 4, display: 'block' };
const SEC: React.CSSProperties = { fontSize: 11, color: '#475569', letterSpacing: 1, marginTop: 22, marginBottom: 8 };
const DASHED_BTN: React.CSSProperties = {
  background: 'none', border: '1px dashed #1e3a5f', borderRadius: 6,
  color: '#475569', cursor: 'pointer', fontSize: 12, padding: '6px 14px', width: '100%',
};

// ── main component ────────────────────────────────────────────────────────────
export default function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const [mtype,      setMtype]      = useState<TKey>('weekly');
  const [lang,       setLang]       = useState<Lang>('zh');
  const [date,       setDate]       = useState(today);
  const [startTime,  setStartTime]  = useState('');
  const [endTime,    setEndTime]    = useState('');
  const [location,   setLocation]   = useState('');
  const [chair,      setChair]      = useState('');
  const [recorder,   setRecorder]   = useState('');
  const [attendees,  setAttendees]  = useState('');
  const [absentees,  setAbsentees]  = useState('');
  const [topics,     setTopics]     = useState<Topic[]>(() =>
    DEFAULT_TOPICS.weekly.map((t, i) => ({ ...t, id: i + 1 }))
  );
  const [decisions,  setDecisions]  = useState<Decision[]>([{ id: 1, content: '' }]);
  const [actions,    setActions]    = useState<Action[]>([{ id: 1, task: '', assignee: '', deadline: '' }]);
  const [nextMeeting,setNextMeeting]= useState('');
  const [notes,      setNotes]      = useState('');
  const [copied,     setCopied]     = useState(false);

  useEffect(() => {
    setTopics(DEFAULT_TOPICS[mtype].map((t, i) => ({ ...t, id: i + 1 })));
  }, [mtype]);

  const output = useMemo(() => generate({
    mtype, lang, date, startTime, endTime, location, chair, recorder,
    attendees, absentees, topics, decisions, actions, nextMeeting, notes,
  }), [mtype, lang, date, startTime, endTime, location, chair, recorder,
    attendees, absentees, topics, decisions, actions, nextMeeting, notes]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const t = TYPES.find(x => x.key === mtype)!;
    const html = printHTML(output, `${t[lang]} ${LBL[lang].pageTitle}`);
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  // topic helpers
  const updTopic = (id: number, f: 'title' | 'discussion', v: string) =>
    setTopics(prev => prev.map(t => t.id === id ? { ...t, [f]: v } : t));
  const addTopic = () =>
    setTopics(prev => [...prev, { id: Date.now(), title: '', discussion: '' }]);
  const rmTopic = (id: number) =>
    setTopics(prev => prev.filter(t => t.id !== id));

  // decision helpers
  const updDec = (id: number, v: string) =>
    setDecisions(prev => prev.map(d => d.id === id ? { ...d, content: v } : d));
  const addDec = () =>
    setDecisions(prev => [...prev, { id: Date.now(), content: '' }]);
  const rmDec = (id: number) =>
    setDecisions(prev => prev.filter(d => d.id !== id));

  // action helpers
  const updAct = (id: number, f: keyof Omit<Action, 'id'>, v: string) =>
    setActions(prev => prev.map(a => a.id === id ? { ...a, [f]: v } : a));
  const addAct = () =>
    setActions(prev => [...prev, { id: Date.now(), task: '', assignee: '', deadline: '' }]);
  const rmAct = (id: number) =>
    setActions(prev => prev.filter(a => a.id !== id));

  const l = LBL[lang];

  return (
    <div style={{ minHeight: '100vh', background: '#030b18', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* ── Header ── */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid #0d1829', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{l.pageTitle}</div>
          <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>{l.subtitle}</div>
        </div>
        {/* meeting type pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setMtype(t.key)} style={{
              padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
              background: mtype === t.key ? '#0ea5e9' : '#0d1829',
              color: mtype === t.key ? '#fff' : '#64748b',
              fontWeight: mtype === t.key ? 600 : 400,
            }}>{t.zh}</button>
          ))}
        </div>
        {/* lang selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(['zh', 'ja', 'en'] as Lang[]).map(lg => (
            <button key={lg} onClick={() => setLang(lg)} style={{
              padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
              background: lang === lg ? '#f59e0b' : '#0d1829',
              color: lang === lg ? '#000' : '#64748b',
              fontWeight: lang === lg ? 700 : 400,
            }}>{lg === 'zh' ? '中' : lg === 'ja' ? '日' : 'EN'}</button>
          ))}
        </div>
      </div>

      {/* ── Body: two columns ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 'calc(100vh - 65px)' }}>

        {/* Left: form */}
        <div style={{ padding: '18px 24px 40px', borderRight: '1px solid #0d1829', overflowY: 'auto' }}>

          {/* Basic info */}
          <div style={SEC}>── {l.basic}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <span style={LBL_S}>{l.date}</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={INP} />
            </div>
            <div>
              <span style={LBL_S}>{l.startTime}</span>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={INP} />
            </div>
            <div>
              <span style={LBL_S}>{l.endTime}</span>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={INP} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <span style={LBL_S}>{l.location}</span>
            <input value={location} onChange={e => setLocation(e.target.value)} style={INP} placeholder={l.locationPh} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <span style={LBL_S}>{l.chair}</span>
              <input value={chair} onChange={e => setChair(e.target.value)} style={INP} placeholder="LUNA" />
            </div>
            <div>
              <span style={LBL_S}>{l.recorder}</span>
              <input value={recorder} onChange={e => setRecorder(e.target.value)} style={INP} placeholder="Nicole" />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <span style={LBL_S}>{l.attendees}</span>
            <input value={attendees} onChange={e => setAttendees(e.target.value)} style={INP} placeholder={lang === 'en' ? 'Alice, Bob, Carol...' : '山田、田中、Nicole...'} />
          </div>
          <div>
            <span style={LBL_S}>{l.absentees}</span>
            <input value={absentees} onChange={e => setAbsentees(e.target.value)} style={INP} placeholder={l.absenteesPh} />
          </div>

          {/* Topics */}
          <div style={SEC}>── {l.topicSec}</div>
          {topics.map((tp, i) => (
            <div key={tp.id} style={{ marginBottom: 10, padding: 12, background: '#06101e', borderRadius: 8, border: '1px solid #0d1829' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                <span style={{ fontSize: 11, color: '#0ea5e9', alignSelf: 'center', flexShrink: 0, minWidth: 40 }}>
                  {l.topicLabel}{i + 1}
                </span>
                <input value={tp.title} onChange={e => updTopic(tp.id, 'title', e.target.value)}
                  style={{ ...INP, flex: 1 }} placeholder={l.topicLabel} />
                {topics.length > 1 && (
                  <button onClick={() => rmTopic(tp.id)} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 17, padding: '0 4px' }}>×</button>
                )}
              </div>
              <textarea value={tp.discussion} onChange={e => updTopic(tp.id, 'discussion', e.target.value)}
                rows={3} style={TA} placeholder={l.discussLabel + '...'} />
            </div>
          ))}
          <button onClick={addTopic} style={DASHED_BTN}>{l.addTopic}</button>

          {/* Decisions */}
          <div style={SEC}>── {l.decisionSec}</div>
          {decisions.map((d, i) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#f59e0b', flexShrink: 0, minWidth: 36 }}>No.{i + 1}</span>
              <input value={d.content} onChange={e => updDec(d.id, e.target.value)}
                style={{ ...INP, flex: 1 }} placeholder={l.decisionSec + '...'} />
              {decisions.length > 1 && (
                <button onClick={() => rmDec(d.id)} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 17, padding: '0 4px' }}>×</button>
              )}
            </div>
          ))}
          <button onClick={addDec} style={DASHED_BTN}>{l.addDecision}</button>

          {/* Action Items */}
          <div style={SEC}>── {l.actionSec}</div>
          {actions.map((a, i) => (
            <div key={a.id} style={{ marginBottom: 10, padding: 10, background: '#06101e', borderRadius: 8, border: '1px solid #0d1829' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                <span style={{ fontSize: 12, color: '#06b6d4', alignSelf: 'center', flexShrink: 0, minWidth: 36 }}>No.{i + 1}</span>
                <input value={a.task} onChange={e => updAct(a.id, 'task', e.target.value)}
                  style={{ ...INP, flex: 1 }} placeholder={l.taskLabel} />
                {actions.length > 1 && (
                  <button onClick={() => rmAct(a.id)} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 17, padding: '0 4px' }}>×</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <span style={LBL_S}>{l.assigneeLabel}</span>
                  <input value={a.assignee} onChange={e => updAct(a.id, 'assignee', e.target.value)} style={INP} placeholder="Nicole" />
                </div>
                <div>
                  <span style={LBL_S}>{l.deadlineLabel}</span>
                  <input type="date" value={a.deadline} onChange={e => updAct(a.id, 'deadline', e.target.value)} style={INP} />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addAct} style={DASHED_BTN}>{l.addAction}</button>

          {/* Next Meeting */}
          <div style={SEC}>── {l.nextSec}</div>
          <input value={nextMeeting} onChange={e => setNextMeeting(e.target.value)} style={INP}
            placeholder={lang === 'en' ? 'e.g. 2026-05-05 10:00' : '例：2026-05-05 10:00'} />

          {/* Notes */}
          <div style={SEC}>── {l.notesSec}</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={TA} placeholder="..." />
        </div>

        {/* Right: preview */}
        <div style={{ padding: '18px 24px', position: 'sticky', top: 0, maxHeight: '100vh', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#475569' }}>{l.preview}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={handleCopy} style={{
                padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13,
                background: copied ? '#16a34a' : '#0ea5e9', color: '#fff', fontWeight: 600, transition: 'background 0.2s',
              }}>{copied ? l.copied : l.copy}</button>
              <button onClick={handlePrint} style={{
                padding: '7px 16px', borderRadius: 7, border: '1px solid #1e3a5f',
                cursor: 'pointer', fontSize: 13, background: 'none', color: '#94a3b8',
              }}>{l.print}</button>
            </div>
          </div>
          <pre style={{
            flex: 1, background: '#06101e', borderRadius: 10, padding: '16px 18px',
            fontSize: 12.5, lineHeight: 1.8, color: '#cbd5e1',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            border: '1px solid #0d1829', minHeight: 400, overflowY: 'auto',
          }}>
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
}
