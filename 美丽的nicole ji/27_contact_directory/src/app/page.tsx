'use client';
import { useState, useMemo, useEffect } from 'react';

// ─── 数据定义 ────────────────────────────────────────────────
interface Contact {
  id: number;
  dept: string;
  group: '業務部' | '非業務部';
  name: string;
  role: string;
  email: string;
  ext: string;
  keywords: string[];
  scenarios: string[];
  color: string;
}

// ※ 邮箱/内线请根据实际情况更新
const CONTACTS: Contact[] = [
  {
    id: 1, dept: '業務部', group: '業務部', name: 'LUNA', role: '業務部部長',
    email: 'luna@optec-exp.com', ext: '#100',
    color: '#0ea5e9',
    keywords: ['luna', '業務部', '部長', '業務'],
    scenarios: ['業務全般', '重要案件の判断', '部門間調整'],
  },
  {
    id: 2, dept: 'OS部門', group: '業務部', name: 'OS担当', role: '操作・報価担当',
    email: 'os-team@optec-exp.com', ext: '#201',
    color: '#0ea5e9',
    keywords: ['os', 'os部門', '報価', '操作', '案件', '海外', '海外開発', 'ブッキング'],
    scenarios: ['報価依頼・確認', '操作・ブッキング', '案件相談', '海外エージェント開発'],
  },
  {
    id: 3, dept: 'GC部門', group: '業務部', name: 'GC担当', role: 'GC業務担当',
    email: 'gc-team@optec-exp.com', ext: '#202',
    color: '#0ea5e9',
    keywords: ['gc', 'gc部門', 'gc業務'],
    scenarios: ['GC案件全般', 'GC業務相談'],
  },
  {
    id: 4, dept: '非業務部', group: '非業務部', name: 'JENNY', role: '非業務部部長',
    email: 'jenny@optec-exp.com', ext: '#200',
    color: '#a78bfa',
    keywords: ['jenny', '非業務部', '部長', '非業務'],
    scenarios: ['非業務全般', '重要事項の判断', '管理部門調整'],
  },
  {
    id: 5, dept: '総務', group: '非業務部', name: '総務担当', role: '総務',
    email: 'soumu@optec-exp.com', ext: '#301',
    color: '#a78bfa',
    keywords: ['総務', '備品', '設備', '事務用品', '会議室', '消耗品'],
    scenarios: ['備品・消耗品申請', '設備・機器故障報告', '会議室予約・管理'],
  },
  {
    id: 6, dept: '人事', group: '非業務部', name: '人事担当', role: '人事',
    email: 'hr@optec-exp.com', ext: '#302',
    color: '#a78bfa',
    keywords: ['人事', '入職', '給与', '有休', '福利', '契約', '雇用', '勤怠'],
    scenarios: ['入職・退職手続き', '給与・有給確認', '福利厚生申請', '勤怠管理'],
  },
  {
    id: 7, dept: '品宣', group: '非業務部', name: '品宣担当', role: '品宣・マーケ',
    email: 'pr@optec-exp.com', ext: '#303',
    color: '#a78bfa',
    keywords: ['品宣', '広告', '宣伝', 'マーケティング', 'sns', '会社紹介', 'パンフレット'],
    scenarios: ['会社紹介資料作成', '広告・PR依頼', 'SNS投稿相談', 'パンフレット発注'],
  },
  {
    id: 8, dept: '財務', group: '非業務部', name: '財務担当', role: '財務・経理',
    email: 'finance@optec-exp.com', ext: '#304',
    color: '#a78bfa',
    keywords: ['財務', '経費', '請求書', '領収書', '精算', '支払い', '経理', '予算'],
    scenarios: ['経費精算・申請', '請求書・領収書処理', '支払い状況確認', '予算確認'],
  },
  {
    id: 9, dept: 'DX室', group: '非業務部', name: 'DX担当', role: 'DX・ITサポート',
    email: 'dx@optec-exp.com', ext: '#305',
    color: '#a78bfa',
    keywords: ['dx', 'dx室', 'it', 'システム', 'pc', 'パソコン', '不具合', 'ログイン', 'アカウント'],
    scenarios: ['システム不具合・問い合わせ', 'PC・機器トラブル', 'アカウント申請', '業務デジタル化相談'],
  },
];

type GroupFilter = 'all' | '業務部' | '非業務部';

// ─── ユーティリティ ──────────────────────────────────────────
function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#f59e0b55', color: '#fbbf24', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── 主组件 ─────────────────────────────────────────────────
export default function Page() {
  const [query,    setQuery]    = useState('');
  const [debounced, setDebounced] = useState('');
  const [group,    setGroup]    = useState<GroupFilter>('all');
  const [copied,   setCopied]   = useState<string | null>(null);

  // 防抖：用户停止输入 200ms 后再搜索
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    return CONTACTS.filter(c => {
      const matchGroup = group === 'all' || c.group === group;
      if (!debounced) return matchGroup;
      const q = debounced;
      return matchGroup && (
        c.name.toLowerCase().includes(q)     ||
        c.dept.toLowerCase().includes(q)     ||
        c.group.toLowerCase().includes(q)    ||
        c.role.toLowerCase().includes(q)     ||
        c.email.toLowerCase().includes(q)    ||
        c.ext.includes(q)                    ||
        c.keywords.some(k => k.toLowerCase().includes(q)) ||
        c.scenarios.some(s => s.toLowerCase().includes(q))
      );
    });
  }, [debounced, group]);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const q = debounced; // short alias for highlight calls

  return (
    <div style={{ minHeight: '100vh', background: '#030b18', color: '#e2e8f0', fontFamily: 'system-ui,"Segoe UI",sans-serif', padding: '24px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#38bdf8', margin: 0 }}>
          📒 OPTEC 部门间联络簿
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>
          人名・部门・联络场景 全关键词搜索 · 邮箱一键复制
        </p>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto 20px' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#475569' }}>🔍</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='搜索姓名、部门、场景... 例："LUNA"、"OS"、"報価"、"システム"'
          style={{
            width: '100%', padding: '12px 16px 12px 42px',
            background: '#0f172a', border: '1px solid #334155', borderRadius: '10px',
            color: '#e2e8f0', fontSize: '14px', outline: 'none',
          }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '18px',
          }}>×</button>
        )}
      </div>

      {/* Group filter tabs */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
        {(['all', '業務部', '非業務部'] as GroupFilter[]).map(g => (
          <button key={g} onClick={() => setGroup(g)} style={{
            padding: '7px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
            background: group === g ? (g === '業務部' ? '#0c2240' : g === '非業務部' ? '#1e0a3c' : '#1e3a5f') : '#0f172a',
            border: `1px solid ${group === g ? (g === '業務部' ? '#0ea5e9' : g === '非業務部' ? '#a78bfa' : '#38bdf8') : '#1e293b'}`,
            color: group === g ? (g === '業務部' ? '#7dd3fc' : g === '非業務部' ? '#c4b5fd' : '#38bdf8') : '#64748b',
          }}>
            {g === 'all' ? `全部 (${CONTACTS.length})` : `${g} (${CONTACTS.filter(c => c.group === g).length})`}
          </button>
        ))}
      </div>

      {/* Result count */}
      {debounced && (
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#475569', marginBottom: '16px' }}>
          「{query}」的搜索结果：{filtered.length} 件
        </div>
      )}

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#334155', fontSize: '16px' }}>
          🔍 没有找到匹配的联系人
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {filtered.map(c => (
            <div key={c.id} style={{
              background: '#0f172a', border: `1px solid ${c.color}33`,
              borderRadius: '14px', padding: '18px', overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Color top bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: c.color, opacity: 0.7 }} />

              {/* Dept + Group badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: c.color }}>
                    {highlight(c.dept, q)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px' }}>{c.group}</div>
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                  color: c.color, background: c.color + '22', border: `1px solid ${c.color}44`,
                }}>
                  {c.role}
                </span>
              </div>

              {/* Name */}
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', marginBottom: '12px' }}>
                👤 {highlight(c.name, q)}
              </div>

              {/* Email */}
              <div
                onClick={() => copyText(c.email)}
                title="クリックでコピー"
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '7px 10px', borderRadius: '7px', cursor: 'pointer',
                  background: copied === c.email ? '#064e3b' : '#1e293b',
                  border: `1px solid ${copied === c.email ? '#10b981' : '#334155'}`,
                  marginBottom: '6px',
                }}
              >
                <span style={{ fontSize: '13px' }}>📧</span>
                <span style={{ fontSize: '12px', color: copied === c.email ? '#6ee7b7' : '#94a3b8', flex: 1 }}>
                  {highlight(c.email, q)}
                </span>
                <span style={{ fontSize: '10px', color: copied === c.email ? '#10b981' : '#334155' }}>
                  {copied === c.email ? '✓ 已复制' : '复制'}
                </span>
              </div>

              {/* Extension */}
              <div
                onClick={() => copyText(c.ext)}
                title="クリックでコピー"
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '7px 10px', borderRadius: '7px', cursor: 'pointer',
                  background: copied === c.ext ? '#064e3b' : '#1e293b',
                  border: `1px solid ${copied === c.ext ? '#10b981' : '#334155'}`,
                  marginBottom: '12px',
                }}
              >
                <span style={{ fontSize: '13px' }}>☎️</span>
                <span style={{ fontSize: '12px', color: copied === c.ext ? '#6ee7b7' : '#94a3b8', flex: 1 }}>
                  内線 {highlight(c.ext, q)}
                </span>
                <span style={{ fontSize: '10px', color: copied === c.ext ? '#10b981' : '#334155' }}>
                  {copied === c.ext ? '✓ 已复制' : '复制'}
                </span>
              </div>

              {/* Scenarios */}
              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
                <div style={{ fontSize: '10px', color: '#475569', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.05em' }}>
                  主な連絡シーン
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {c.scenarios.map((s, i) => (
                    <span key={i} style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                      background: c.color + '15', border: `1px solid ${c.color}33`, color: '#94a3b8',
                    }}>
                      {highlight(s, q)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer note */}
      <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '11px', color: '#1e293b' }}>
        ※ 邮箱・内线如有变更请通知 DX室更新 · メール・内線番号は変更時 DX室までご連絡ください
      </div>
    </div>
  );
}
