'use client';

import { useState, useCallback } from 'react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Lang = 'zh' | 'ja' | 'en';
type MeetingType = 'monthly' | 'project' | 'client' | 'internal' | 'emergency';
type VenueType = 'online' | 'offline' | 'hybrid';

interface AgendaItem {
  id: string;
  title: string;
  duration: number;
  owner: string;
}

interface FormData {
  meetingType: MeetingType;
  meetingName: string;
  date: string;
  time: string;
  venue: VenueType;
  venueDetail: string;
  host: string;
  participants: string[];
  duration: number;
  agendaItems: AgendaItem[];
  notes: string;
}

// ─────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────
const T = {
  zh: {
    appTitle: '会议议程模板生成器',
    appSubtitle: 'OPTEC 财务部门',
    langLabel: '语言',
    configPanel: '配置面板',
    meetingTypeLabel: '会议类型',
    basicInfo: '基本信息',
    meetingName: '会议名称',
    date: '日期',
    time: '时间',
    venue: '地点',
    venueOnline: '线上',
    venueOffline: '线下',
    venueHybrid: '混合',
    venueDetail: '地点详情（链接/地址）',
    host: '主持人',
    participants: '参与者',
    addParticipant: '+ 添加参与者',
    removePart: '×',
    estimatedDuration: '预计总时长（分钟）',
    agendaItems: '议题列表',
    addItem: '+ 添加议题',
    itemTitle: '议题名称',
    itemDuration: '时长(分)',
    itemOwner: '负责人',
    moveUp: '↑',
    moveDown: '↓',
    removeItem: '×',
    notes: '备注 / 注意事项',
    notesPlaceholder: '请输入会议注意事项、准备材料等……',
    previewTitle: '文档预览',
    copyBtn: '一键复制',
    printBtn: '打印',
    copied: '已复制！',
    totalDuration: '总时长',
    minutes: '分钟',
    meetingTypes: {
      monthly: '月度财务例会',
      project: '项目进度汇报',
      client: '客户商务洽谈',
      internal: '部门内部沟通',
      emergency: '应急问题协商',
    },
    venueLabels: { online: '线上', offline: '线下', hybrid: '混合' },
    docHeader: '会议议程',
    docDept: 'OPTEC 财务部门',
    docType: '会议类型',
    docDate: '日期',
    docTime: '时间',
    docVenue: '地点',
    docHost: '主持人',
    docParticipants: '参与者',
    docDuration: '预计时长',
    docAgenda: '议程安排',
    docNotes: '备注',
    docMin: '分钟',
    docNo: '序号',
    docItemTitle: '议题内容',
    docItemDuration: '时长',
    docItemOwner: '负责人',
    docTotal: '合计时长',
    docFooter: '请准时参加会议，提前阅读相关材料。如有变更，将另行通知。',
  },
  ja: {
    appTitle: '会議アジェンダテンプレートジェネレーター',
    appSubtitle: 'OPTEC 財務部門',
    langLabel: '言語',
    configPanel: '設定パネル',
    meetingTypeLabel: '会議種別',
    basicInfo: '基本情報',
    meetingName: '会議名',
    date: '日付',
    time: '時刻',
    venue: '会場',
    venueOnline: 'オンライン',
    venueOffline: '対面',
    venueHybrid: 'ハイブリッド',
    venueDetail: '会場詳細（URL/住所）',
    host: '司会者',
    participants: '参加者',
    addParticipant: '+ 参加者を追加',
    removePart: '×',
    estimatedDuration: '予定所要時間（分）',
    agendaItems: '議題一覧',
    addItem: '+ 議題を追加',
    itemTitle: '議題名',
    itemDuration: '時間(分)',
    itemOwner: '担当者',
    moveUp: '↑',
    moveDown: '↓',
    removeItem: '×',
    notes: '備考・注意事項',
    notesPlaceholder: '会議の注意事項、準備資料などをご記入ください……',
    previewTitle: 'ドキュメントプレビュー',
    copyBtn: 'コピー',
    printBtn: '印刷',
    copied: 'コピーしました！',
    totalDuration: '合計時間',
    minutes: '分',
    meetingTypes: {
      monthly: '月次財務定例会',
      project: 'プロジェクト進捗報告',
      client: '顧客商談',
      internal: '部門内部協議',
      emergency: '緊急問題協議',
    },
    venueLabels: { online: 'オンライン', offline: '対面', hybrid: 'ハイブリッド' },
    docHeader: '会議アジェンダ',
    docDept: 'OPTEC 財務部門',
    docType: '会議種別',
    docDate: '日付',
    docTime: '時刻',
    docVenue: '会場',
    docHost: '司会者',
    docParticipants: '参加者',
    docDuration: '予定所要時間',
    docAgenda: '議事次第',
    docNotes: '備考',
    docMin: '分',
    docNo: 'No.',
    docItemTitle: '議題内容',
    docItemDuration: '所要時間',
    docItemOwner: '担当者',
    docTotal: '合計時間',
    docFooter: '定刻にご参加ください。関連資料を事前にご確認ください。変更がある場合は別途ご連絡いたします。',
  },
  en: {
    appTitle: 'Meeting Agenda Template Generator',
    appSubtitle: 'OPTEC Finance Department',
    langLabel: 'Language',
    configPanel: 'Configuration',
    meetingTypeLabel: 'Meeting Type',
    basicInfo: 'Basic Information',
    meetingName: 'Meeting Name',
    date: 'Date',
    time: 'Time',
    venue: 'Venue',
    venueOnline: 'Online',
    venueOffline: 'In-Person',
    venueHybrid: 'Hybrid',
    venueDetail: 'Venue Details (URL / Address)',
    host: 'Chairperson',
    participants: 'Participants',
    addParticipant: '+ Add Participant',
    removePart: '×',
    estimatedDuration: 'Estimated Duration (minutes)',
    agendaItems: 'Agenda Items',
    addItem: '+ Add Item',
    itemTitle: 'Topic',
    itemDuration: 'Duration(min)',
    itemOwner: 'Owner',
    moveUp: '↑',
    moveDown: '↓',
    removeItem: '×',
    notes: 'Notes / Remarks',
    notesPlaceholder: 'Enter meeting notes, materials to prepare, etc...',
    previewTitle: 'Document Preview',
    copyBtn: 'Copy',
    printBtn: 'Print',
    copied: 'Copied!',
    totalDuration: 'Total Duration',
    minutes: 'min',
    meetingTypes: {
      monthly: 'Monthly Finance Review',
      project: 'Project Progress Report',
      client: 'Client Business Meeting',
      internal: 'Internal Team Discussion',
      emergency: 'Emergency Issue Consultation',
    },
    venueLabels: { online: 'Online', offline: 'In-Person', hybrid: 'Hybrid' },
    docHeader: 'Meeting Agenda',
    docDept: 'OPTEC Finance Department',
    docType: 'Meeting Type',
    docDate: 'Date',
    docTime: 'Time',
    docVenue: 'Venue',
    docHost: 'Chairperson',
    docParticipants: 'Participants',
    docDuration: 'Duration',
    docAgenda: 'Agenda',
    docNotes: 'Notes',
    docMin: 'min',
    docNo: 'No.',
    docItemTitle: 'Topic',
    docItemDuration: 'Duration',
    docItemOwner: 'Owner',
    docTotal: 'Total',
    docFooter: 'Please join on time and review relevant materials in advance. Any changes will be communicated separately.',
  },
};

// ─────────────────────────────────────────────
// Default agenda items per meeting type
// ─────────────────────────────────────────────
const defaultItems: Record<MeetingType, Record<Lang, AgendaItem[]>> = {
  monthly: {
    zh: [
      { id: '1', title: '上月财务数据回顾', duration: 15, owner: '财务主管' },
      { id: '2', title: '本月预算执行情况', duration: 20, owner: '预算专员' },
      { id: '3', title: '费用异常分析', duration: 15, owner: '财务分析师' },
      { id: '4', title: '下月重点工作安排', duration: 10, owner: '财务主管' },
      { id: '5', title: '其他事项', duration: 10, owner: '全体' },
    ],
    ja: [
      { id: '1', title: '先月の財務データレビュー', duration: 15, owner: '財務責任者' },
      { id: '2', title: '当月予算執行状況', duration: 20, owner: '予算担当' },
      { id: '3', title: '費用異常分析', duration: 15, owner: '財務アナリスト' },
      { id: '4', title: '翌月の重点業務計画', duration: 10, owner: '財務責任者' },
      { id: '5', title: 'その他', duration: 10, owner: '全員' },
    ],
    en: [
      { id: '1', title: 'Last Month Financial Data Review', duration: 15, owner: 'Finance Manager' },
      { id: '2', title: 'Current Month Budget Execution', duration: 20, owner: 'Budget Analyst' },
      { id: '3', title: 'Cost Variance Analysis', duration: 15, owner: 'Financial Analyst' },
      { id: '4', title: 'Next Month Key Tasks', duration: 10, owner: 'Finance Manager' },
      { id: '5', title: 'Other Business', duration: 10, owner: 'All' },
    ],
  },
  project: {
    zh: [
      { id: '1', title: '项目总体进度概述', duration: 10, owner: '项目经理' },
      { id: '2', title: '各模块完成情况', duration: 20, owner: '各负责人' },
      { id: '3', title: '风险与问题识别', duration: 15, owner: '项目经理' },
      { id: '4', title: '下阶段计划与里程碑', duration: 15, owner: '项目经理' },
    ],
    ja: [
      { id: '1', title: 'プロジェクト全体進捗概要', duration: 10, owner: 'プロジェクトマネージャー' },
      { id: '2', title: '各モジュールの完成状況', duration: 20, owner: '各担当者' },
      { id: '3', title: 'リスク・課題の特定', duration: 15, owner: 'プロジェクトマネージャー' },
      { id: '4', title: '次フェーズ計画・マイルストーン', duration: 15, owner: 'プロジェクトマネージャー' },
    ],
    en: [
      { id: '1', title: 'Overall Project Progress Overview', duration: 10, owner: 'Project Manager' },
      { id: '2', title: 'Module Completion Status', duration: 20, owner: 'Module Leads' },
      { id: '3', title: 'Risk & Issue Identification', duration: 15, owner: 'Project Manager' },
      { id: '4', title: 'Next Phase Plan & Milestones', duration: 15, owner: 'Project Manager' },
    ],
  },
  client: {
    zh: [
      { id: '1', title: '双方介绍与开场', duration: 10, owner: '主持人' },
      { id: '2', title: '公司业务及服务介绍', duration: 20, owner: '业务代表' },
      { id: '3', title: '客户需求了解', duration: 20, owner: '客户' },
      { id: '4', title: '合作方案探讨', duration: 20, owner: '双方' },
      { id: '5', title: '后续步骤确认', duration: 10, owner: '主持人' },
    ],
    ja: [
      { id: '1', title: '双方紹介・開会', duration: 10, owner: '司会者' },
      { id: '2', title: '自社事業・サービス紹介', duration: 20, owner: '営業担当' },
      { id: '3', title: 'お客様のニーズ把握', duration: 20, owner: 'お客様' },
      { id: '4', title: '協力方案の検討', duration: 20, owner: '双方' },
      { id: '5', title: '次のステップ確認', duration: 10, owner: '司会者' },
    ],
    en: [
      { id: '1', title: 'Introductions & Opening', duration: 10, owner: 'Chairperson' },
      { id: '2', title: 'Company Overview & Services', duration: 20, owner: 'Sales Rep' },
      { id: '3', title: 'Client Needs Assessment', duration: 20, owner: 'Client' },
      { id: '4', title: 'Partnership Proposal Discussion', duration: 20, owner: 'Both Parties' },
      { id: '5', title: 'Next Steps Confirmation', duration: 10, owner: 'Chairperson' },
    ],
  },
  internal: {
    zh: [
      { id: '1', title: '近期工作汇报', duration: 20, owner: '各成员' },
      { id: '2', title: '问题反馈与讨论', duration: 20, owner: '全体' },
      { id: '3', title: '流程优化建议', duration: 15, owner: '全体' },
      { id: '4', title: '下周工作安排', duration: 15, owner: '主管' },
    ],
    ja: [
      { id: '1', title: '最近の業務報告', duration: 20, owner: '各メンバー' },
      { id: '2', title: '問題のフィードバックと討議', duration: 20, owner: '全員' },
      { id: '3', title: 'プロセス改善提案', duration: 15, owner: '全員' },
      { id: '4', title: '翌週の業務計画', duration: 15, owner: 'マネージャー' },
    ],
    en: [
      { id: '1', title: 'Recent Work Updates', duration: 20, owner: 'All Members' },
      { id: '2', title: 'Issue Feedback & Discussion', duration: 20, owner: 'All' },
      { id: '3', title: 'Process Improvement Suggestions', duration: 15, owner: 'All' },
      { id: '4', title: 'Next Week Work Plan', duration: 15, owner: 'Manager' },
    ],
  },
  emergency: {
    zh: [
      { id: '1', title: '问题描述与现状说明', duration: 10, owner: '报告人' },
      { id: '2', title: '影响范围评估', duration: 10, owner: '各相关方' },
      { id: '3', title: '应急方案讨论', duration: 20, owner: '全体' },
      { id: '4', title: '责任分工与执行时间表', duration: 10, owner: '主持人' },
      { id: '5', title: '后续跟进机制', duration: 10, owner: '主持人' },
    ],
    ja: [
      { id: '1', title: '問題の説明と現状報告', duration: 10, owner: '報告者' },
      { id: '2', title: '影響範囲の評価', duration: 10, owner: '関係者各位' },
      { id: '3', title: '緊急対応策の検討', duration: 20, owner: '全員' },
      { id: '4', title: '役割分担・実行スケジュール', duration: 10, owner: '司会者' },
      { id: '5', title: 'フォローアップ体制', duration: 10, owner: '司会者' },
    ],
    en: [
      { id: '1', title: 'Issue Description & Current Status', duration: 10, owner: 'Reporter' },
      { id: '2', title: 'Impact Scope Assessment', duration: 10, owner: 'Stakeholders' },
      { id: '3', title: 'Emergency Response Discussion', duration: 20, owner: 'All' },
      { id: '4', title: 'Responsibility Assignment & Timeline', duration: 10, owner: 'Chairperson' },
      { id: '5', title: 'Follow-up Mechanism', duration: 10, owner: 'Chairperson' },
    ],
  },
};

const defaultMeetingNames: Record<MeetingType, Record<Lang, string>> = {
  monthly: { zh: '月度财务例会', ja: '月次財務定例会', en: 'Monthly Finance Review' },
  project: { zh: '项目进度汇报会议', ja: 'プロジェクト進捗報告会議', en: 'Project Progress Report Meeting' },
  client: { zh: '客户商务洽谈会议', ja: '顧客商談会議', en: 'Client Business Meeting' },
  internal: { zh: '部门内部沟通会议', ja: '部門内部協議', en: 'Internal Team Meeting' },
  emergency: { zh: '应急问题协商会议', ja: '緊急問題協議', en: 'Emergency Issue Consultation' },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function Page() {
  const [lang, setLang] = useState<Lang>('zh');
  const [copied, setCopied] = useState(false);

  const t = T[lang];

  const initForm = (type: MeetingType, l: Lang): FormData => ({
    meetingType: type,
    meetingName: defaultMeetingNames[type][l],
    date: today(),
    time: '10:00',
    venue: 'offline',
    venueDetail: '',
    host: '',
    participants: [''],
    duration: 60,
    agendaItems: defaultItems[type][l].map(item => ({ ...item, id: uid() })),
    notes: '',
  });

  const [form, setForm] = useState<FormData>(() => initForm('monthly', 'zh'));

  // ── Language switch ──
  const switchLang = (l: Lang) => {
    setLang(l);
    setForm(prev => ({
      ...initForm(prev.meetingType, l),
      date: prev.date,
      time: prev.time,
      venue: prev.venue,
      venueDetail: prev.venueDetail,
      host: prev.host,
      participants: prev.participants,
      duration: prev.duration,
      notes: prev.notes,
    }));
  };

  // ── Meeting type switch ──
  const switchType = (type: MeetingType) => {
    setForm(prev => ({
      ...prev,
      meetingType: type,
      meetingName: defaultMeetingNames[type][lang],
      agendaItems: defaultItems[type][lang].map(item => ({ ...item, id: uid() })),
    }));
  };

  // ── Field updates ──
  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // ── Participants ──
  const updateParticipant = (idx: number, val: string) =>
    setForm(prev => {
      const p = [...prev.participants];
      p[idx] = val;
      return { ...prev, participants: p };
    });

  const addParticipant = () =>
    setForm(prev => ({ ...prev, participants: [...prev.participants, ''] }));

  const removeParticipant = (idx: number) =>
    setForm(prev => ({ ...prev, participants: prev.participants.filter((_, i) => i !== idx) }));

  // ── Agenda items ──
  const updateItem = (id: string, field: keyof AgendaItem, value: string | number) =>
    setForm(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(item => item.id === id ? { ...item, [field]: value } : item),
    }));

  const addItem = () =>
    setForm(prev => ({
      ...prev,
      agendaItems: [...prev.agendaItems, { id: uid(), title: '', duration: 10, owner: '' }],
    }));

  const removeItem = (id: string) =>
    setForm(prev => ({ ...prev, agendaItems: prev.agendaItems.filter(i => i.id !== id) }));

  const moveItem = (id: string, dir: -1 | 1) =>
    setForm(prev => {
      const arr = [...prev.agendaItems];
      const idx = arr.findIndex(i => i.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return prev;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...prev, agendaItems: arr };
    });

  // ── Total duration ──
  const totalMin = form.agendaItems.reduce((s, i) => s + (Number(i.duration) || 0), 0);

  // ── Document text for copy ──
  const buildDocText = useCallback(() => {
    const lines: string[] = [];
    lines.push(`${'='.repeat(50)}`);
    lines.push(`  OPTEC ${t.docDept}`);
    lines.push(`  ${t.docHeader}`);
    lines.push(`${'='.repeat(50)}`);
    lines.push('');
    lines.push(`【${t.docType}】${t.meetingTypes[form.meetingType]}`);
    lines.push(`【${t.docDate}】${form.date}`);
    lines.push(`【${t.docTime}】${form.time}`);
    lines.push(`【${t.docVenue}】${t.venueLabels[form.venue]}${form.venueDetail ? '  ' + form.venueDetail : ''}`);
    lines.push(`【${t.docHost}】${form.host || '-'}`);
    lines.push(`【${t.docParticipants}】${form.participants.filter(Boolean).join('、') || '-'}`);
    lines.push(`【${t.docDuration}】${form.duration} ${t.docMin}`);
    lines.push('');
    lines.push(`─── ${t.docAgenda} ───`);
    form.agendaItems.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item.title || '-'}  [${item.duration}${t.docMin}]  ${t.docItemOwner}: ${item.owner || '-'}`);
    });
    lines.push('');
    lines.push(`${t.docTotal}: ${totalMin} ${t.docMin}`);
    if (form.notes) {
      lines.push('');
      lines.push(`─── ${t.docNotes} ───`);
      lines.push(form.notes);
    }
    lines.push('');
    lines.push(t.docFooter);
    lines.push(`${'='.repeat(50)}`);
    return lines.join('\n');
  }, [form, t, totalMin]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildDocText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => window.print();

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Header */}
      <header className="no-print" style={{ background: '#7c3aed', color: 'white', padding: '16px 24px', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>📋 {t.appTitle}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>{t.appSubtitle}</div>
          </div>
          {/* Language switcher */}
          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 4 }}>
            {(['zh', 'ja', 'en'] as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => switchLang(l)}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  background: lang === l ? 'white' : 'transparent',
                  color: lang === l ? '#7c3aed' : 'white',
                  transition: 'all 0.2s',
                }}
              >
                {l === 'zh' ? '中文' : l === 'ja' ? '日本語' : 'English'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px', display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Left: Config panel ── */}
        <div className="no-print" style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#7c3aed', margin: 0, borderBottom: '2px solid #ede9fe', paddingBottom: 10 }}>
            ⚙️ {t.configPanel}
          </h2>

          {/* Meeting type */}
          <section>
            <Label>{t.meetingTypeLabel}</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {(['monthly', 'project', 'client', 'internal', 'emergency'] as MeetingType[]).map(type => (
                <button
                  key={type}
                  onClick={() => switchType(type)}
                  style={{
                    padding: '9px 14px', borderRadius: 8, border: '2px solid',
                    borderColor: form.meetingType === type ? '#7c3aed' : '#e5e7eb',
                    background: form.meetingType === type ? '#f5f3ff' : 'white',
                    color: form.meetingType === type ? '#7c3aed' : '#374151',
                    fontWeight: form.meetingType === type ? 700 : 400,
                    textAlign: 'left', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s',
                  }}
                >
                  {t.meetingTypes[type]}
                </button>
              ))}
            </div>
          </section>

          {/* Basic info */}
          <section>
            <Label>{t.basicInfo}</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <FieldGroup label={t.meetingName}>
                <input style={inputStyle} value={form.meetingName} onChange={e => setField('meetingName', e.target.value)} />
              </FieldGroup>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <FieldGroup label={t.date}>
                  <input style={inputStyle} type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
                </FieldGroup>
                <FieldGroup label={t.time}>
                  <input style={inputStyle} type="time" value={form.time} onChange={e => setField('time', e.target.value)} />
                </FieldGroup>
              </div>
              <FieldGroup label={t.venue}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['online', 'offline', 'hybrid'] as VenueType[]).map(v => (
                    <button
                      key={v}
                      onClick={() => setField('venue', v)}
                      style={{
                        flex: 1, padding: '7px 4px', borderRadius: 6, border: '2px solid',
                        borderColor: form.venue === v ? '#7c3aed' : '#e5e7eb',
                        background: form.venue === v ? '#7c3aed' : 'white',
                        color: form.venue === v ? 'white' : '#374151',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                      }}
                    >
                      {t.venueLabels[v]}
                    </button>
                  ))}
                </div>
              </FieldGroup>
              <FieldGroup label={t.venueDetail}>
                <input style={inputStyle} value={form.venueDetail} onChange={e => setField('venueDetail', e.target.value)} />
              </FieldGroup>
              <FieldGroup label={t.host}>
                <input style={inputStyle} value={form.host} onChange={e => setField('host', e.target.value)} />
              </FieldGroup>
              <FieldGroup label={t.estimatedDuration}>
                <input style={inputStyle} type="number" min={5} max={480} value={form.duration} onChange={e => setField('duration', Number(e.target.value))} />
              </FieldGroup>

              {/* Participants */}
              <FieldGroup label={t.participants}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {form.participants.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6 }}>
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        value={p}
                        onChange={e => updateParticipant(i, e.target.value)}
                        placeholder={`#${i + 1}`}
                      />
                      {form.participants.length > 1 && (
                        <button onClick={() => removeParticipant(i)} style={iconBtnStyle('#ef4444')}>{t.removePart}</button>
                      )}
                    </div>
                  ))}
                  <button onClick={addParticipant} style={addBtnStyle}>{t.addParticipant}</button>
                </div>
              </FieldGroup>
            </div>
          </section>

          {/* Agenda items */}
          <section>
            <Label>{t.agendaItems}</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {form.agendaItems.map((item, idx) => (
                <div key={item.id} style={{ background: '#faf5ff', border: '1px solid #ede9fe', borderRadius: 8, padding: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700, minWidth: 20 }}>{idx + 1}.</span>
                    <input
                      style={{ ...inputStyle, flex: 1, fontSize: 13 }}
                      value={item.title}
                      onChange={e => updateItem(item.id, 'title', e.target.value)}
                      placeholder={t.itemTitle}
                    />
                    <button onClick={() => moveItem(item.id, -1)} style={iconBtnStyle('#6b7280')} disabled={idx === 0}>{t.moveUp}</button>
                    <button onClick={() => moveItem(item.id, 1)} style={iconBtnStyle('#6b7280')} disabled={idx === form.agendaItems.length - 1}>{t.moveDown}</button>
                    <button onClick={() => removeItem(item.id)} style={iconBtnStyle('#ef4444')}>{t.removeItem}</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <FieldGroup label={t.itemDuration}>
                      <input
                        style={{ ...inputStyle, fontSize: 13 }}
                        type="number" min={1} max={240}
                        value={item.duration}
                        onChange={e => updateItem(item.id, 'duration', Number(e.target.value))}
                      />
                    </FieldGroup>
                    <FieldGroup label={t.itemOwner}>
                      <input
                        style={{ ...inputStyle, fontSize: 13 }}
                        value={item.owner}
                        onChange={e => updateItem(item.id, 'owner', e.target.value)}
                      />
                    </FieldGroup>
                  </div>
                </div>
              ))}
              <button onClick={addItem} style={addBtnStyle}>{t.addItem}</button>
            </div>
          </section>

          {/* Notes */}
          <section>
            <Label>{t.notes}</Label>
            <textarea
              style={{ ...inputStyle, marginTop: 8, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder={t.notesPlaceholder}
            />
          </section>
        </div>

        {/* ── Right: Preview ── */}
        <div>
          {/* Action buttons */}
          <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 16, justifyContent: 'flex-end' }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: copied ? '#059669' : '#7c3aed', color: 'white', fontWeight: 700, fontSize: 14,
                boxShadow: '0 2px 8px rgba(124,58,237,0.3)', transition: 'all 0.2s',
              }}
            >
              {copied ? t.copied : t.copyBtn}
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding: '10px 24px', borderRadius: 8, border: '2px solid #7c3aed', cursor: 'pointer',
                background: 'white', color: '#7c3aed', fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
              }}
            >
              🖨️ {t.printBtn}
            </button>
          </div>

          {/* Document preview */}
          <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: '40px 48px', minHeight: 600, fontFamily: 'inherit' }}>
            {/* Doc header */}
            <div style={{ textAlign: 'center', borderBottom: '3px solid #7c3aed', paddingBottom: 20, marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: '#7c3aed', fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>OPTEC</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1e1b4b', letterSpacing: 1, marginBottom: 4 }}>{t.docHeader}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{t.docDept}</div>
            </div>

            {/* Info table */}
            <div style={{ marginBottom: 28, background: '#faf5ff', borderRadius: 8, padding: '16px 20px', border: '1px solid #ede9fe' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    [t.docType, t.meetingTypes[form.meetingType]],
                    [t.meetingName, form.meetingName || '-'],
                    [t.docDate, form.date || '-'],
                    [t.docTime, form.time || '-'],
                    [t.docVenue, `${t.venueLabels[form.venue]}${form.venueDetail ? '  ' + form.venueDetail : ''}`],
                    [t.docHost, form.host || '-'],
                    [t.docParticipants, form.participants.filter(Boolean).join('  /  ') || '-'],
                    [t.docDuration, `${form.duration} ${t.docMin}`],
                  ].map(([label, value]) => (
                    <tr key={label} style={{ borderBottom: '1px solid #ede9fe' }}>
                      <td style={{ padding: '7px 12px 7px 0', width: '30%', color: '#7c3aed', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{label}</td>
                      <td style={{ padding: '7px 0', color: '#1f2937', fontSize: 14 }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Agenda table */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#7c3aed', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#7c3aed', color: 'white', borderRadius: 4, padding: '2px 10px', fontSize: 13 }}>{t.docAgenda}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#7c3aed', color: 'white' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'center', width: 44, borderRadius: '6px 0 0 0' }}>{t.docNo}</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>{t.docItemTitle}</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', width: 80, whiteSpace: 'nowrap' }}>{t.docItemDuration}</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', width: 100, borderRadius: '0 6px 0 0', whiteSpace: 'nowrap' }}>{t.docItemOwner}</th>
                  </tr>
                </thead>
                <tbody>
                  {form.agendaItems.map((item, idx) => (
                    <tr key={item.id} style={{ background: idx % 2 === 0 ? '#faf5ff' : 'white', borderBottom: '1px solid #ede9fe' }}>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#7c3aed', fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ padding: '10px 12px', color: '#1f2937' }}>{item.title || <span style={{ color: '#9ca3af' }}>-</span>}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#374151', fontWeight: 600 }}>
                        {item.duration} <span style={{ fontSize: 11, color: '#9ca3af' }}>{t.docMin}</span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#374151' }}>{item.owner || '-'}</td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr style={{ background: '#ede9fe', fontWeight: 800 }}>
                    <td colSpan={2} style={{ padding: '10px 12px', color: '#7c3aed', textAlign: 'right' }}>{t.docTotal}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#7c3aed', fontSize: 15 }}>
                      {totalMin} <span style={{ fontSize: 11 }}>{t.docMin}</span>
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notes */}
            {form.notes && (
              <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>{t.docNotes}</div>
                <div style={{ fontSize: 14, color: '#78350f', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{form.notes}</div>
              </div>
            )}

            {/* Footer */}
            <div style={{ borderTop: '2px solid #ede9fe', paddingTop: 16, textAlign: 'center', color: '#9ca3af', fontSize: 12, lineHeight: 1.8 }}>
              {t.docFooter}
              <div style={{ marginTop: 6, color: '#c4b5fd', fontSize: 11 }}>OPTEC — {new Date().getFullYear()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Small helper components & styles
// ─────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 2 }}>{children}</div>;
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1.5px solid #e5e7eb',
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  color: '#1f2937',
  background: 'white',
};

function iconBtnStyle(color: string): React.CSSProperties {
  return {
    padding: '4px 8px',
    borderRadius: 5,
    border: `1.5px solid ${color}`,
    background: 'white',
    color,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1,
    flexShrink: 0,
  };
}

const addBtnStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 7,
  border: '2px dashed #7c3aed',
  background: 'transparent',
  color: '#7c3aed',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 700,
  width: '100%',
};
