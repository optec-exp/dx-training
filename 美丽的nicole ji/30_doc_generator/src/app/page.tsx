'use client';

// ── 知识点：Google Docs API + Drive API ──────────────────
//
// 流程：
// 1. ブラウザ側 OAuth でログイン（作品29と同じ方式）
// 2. Drive API でテンプレートをコピー
//    POST /drive/v3/files/{templateId}/copy
// 3. Docs API でコピー済み文書の {{占位符}} を一括置換
//    POST /docs/v1/documents/{docId}:batchUpdate
// 4. Drive API で PDF エクスポート URL を生成
//    GET  /drive/v3/files/{docId}/export?mimeType=application/pdf

import { useState } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

const C = {
  bg:      '#f0f4f8',
  white:   '#ffffff',
  primary: '#0050b3',
  accent:  '#1677ff',
  text:    '#1a1a2e',
  sub:     '#5a6a7a',
  border:  '#d0dae6',
  green:   '#389e0d',
  red:     '#cf1322',
};

const TEMPLATE_ID = process.env.NEXT_PUBLIC_TEMPLATE_DOC_ID!;

// 今日の日付（デフォルト値として使用）
const today = new Date().toISOString().slice(0, 10);

// ── フォームのフィールド定義 ──────────────────────────────
const FIELDS: { key: string; label: string; placeholder: string; defaultValue?: string }[] = [
  { key: '作成日',     label: '作成日',     placeholder: '2024-01-01', defaultValue: today },
  { key: '案件番号',   label: '案件番号',   placeholder: 'OPT-2024-001' },
  { key: '顧客名',     label: '顧客名',     placeholder: '株式会社○○' },
  { key: '案件テーマ', label: '案件テーマ', placeholder: '東京→上海 航空輸送' },
  { key: 'Mode',       label: 'Mode',       placeholder: 'Export / Import' },
  { key: 'ETD',        label: 'ETD',        placeholder: '2024-02-01' },
  { key: 'ETA',        label: 'ETA',        placeholder: '2024-02-03' },
  { key: 'AWB_NO',     label: 'AWB NO',     placeholder: '123-45678901' },
  { key: '備考',       label: '備考',       placeholder: '特記事項があれば入力' },
  { key: '担当者',     label: '担当者',     placeholder: 'Nicole Ji' },
];

// ── Google API ヘルパー ────────────────────────────────────
async function gFetch(url: string, token: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google API ${res.status}: ${err}`);
  }
  return res;
}

// ── メインアプリ ──────────────────────────────────────────
function DocApp() {
  const [token,    setToken]    = useState('');
  const [userName, setUserName] = useState('');
  const [values,   setValues]   = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map(f => [f.key, f.defaultValue ?? '']))
  );
  const [status,  setStatus]  = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [docUrl,  setDocUrl]  = useState('');
  const [pdfUrl,  setPdfUrl]  = useState('');
  const [message, setMessage] = useState('');

  // ── ログイン ────────────────────────────────────────────
  const login = useGoogleLogin({
    // Docs API + Drive API のスコープを要求
    scope: [
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive',
    ].join(' '),
    onSuccess: async (res) => {
      setToken(res.access_token);
      try {
        const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${res.access_token}` },
        }).then(r => r.json());
        setUserName(info.name ?? info.email ?? '');
      } catch { /* OK */ }
    },
    onError: (e) => setMessage(JSON.stringify(e)),
  });

  // ── 文書生成メイン処理 ────────────────────────────────────
  const generate = async () => {
    if (!token) return;
    setStatus('working');
    setMessage('テンプレートをコピー中...');

    try {
      // ① Drive API: テンプレートをコピー
      const copyRes = await gFetch(
        `https://www.googleapis.com/drive/v3/files/${TEMPLATE_ID}/copy`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: `案件確認書_${values['顧客名'] || 'Draft'}_${values['作成日'] || today}`,
          }),
        }
      );
      const copyData = await copyRes.json();
      const newDocId: string = copyData.id;
      setMessage('占位符を置換中...');

      // ② Docs API: {{占位符}} を一括置換
      // batchUpdate = 複数の編集操作をまとめて送る
      const requests = FIELDS.map(f => ({
        replaceAllText: {
          containsText: { text: `{{${f.key}}}`, matchCase: true },
          replaceText:  values[f.key] || `（${f.label}未入力）`,
        },
      }));

      await gFetch(
        `https://docs.googleapis.com/v1/documents/${newDocId}:batchUpdate`,
        token,
        { method: 'POST', body: JSON.stringify({ requests }) }
      );

      setMessage('完成！');

      // ③ リンクを生成
      setDocUrl(`https://docs.google.com/document/d/${newDocId}/edit`);
      setPdfUrl(`https://docs.google.com/document/d/${newDocId}/export?format=pdf`);
      setStatus('done');

    } catch (e) {
      setMessage(e instanceof Error ? e.message : '生成失敗');
      setStatus('error');
    }
  };

  // ── 未ログイン ────────────────────────────────────────────
  if (!token) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: 'Arial, sans-serif' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>案件確認書 自動生成</h1>
        <p style={{ color: C.sub, marginBottom: 32, fontSize: 14 }}>Google アカウントでログインして文書を生成します</p>
        {message && <div style={{ color: C.red, marginBottom: 12, fontSize: 12 }}>{message}</div>}
        <button onClick={() => login()} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 24px', borderRadius: 8,
          border: `1px solid ${C.border}`, background: C.white, color: C.text,
          fontSize: 15, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,.12)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google アカウントでログイン
        </button>
      </div>
    );
  }

  // ── ログイン済み ──────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <header style={{
        background: C.primary, color: '#fff', padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,.2)',
      }}>
        <span style={{ fontSize: 22 }}>📄</span>
        <span style={{ fontSize: 18, fontWeight: 700 }}>案件確認書 自動生成</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {userName && <span style={{ fontSize: 13, opacity: .85 }}>{userName}</span>}
          <button onClick={() => { setToken(''); setStatus('idle'); setDocUrl(''); setPdfUrl(''); }}
            style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,.4)', background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
            ログアウト
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>

        {/* ── 入力フォーム ──────────────────────────────── */}
        <div style={{ background: C.white, borderRadius: 10, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 18 }}>
            📝 案件情報を入力
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {FIELDS.map(f => (
              <div key={f.key} style={{ gridColumn: f.key === '案件テーマ' || f.key === '備考' ? 'span 2' : 'span 1' }}>
                <label style={{ display: 'block', fontSize: 12, color: C.sub, marginBottom: 4 }}>
                  {f.label}
                </label>
                <input
                  type="text"
                  value={values[f.key] ?? ''}
                  onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 6,
                    border: `1px solid ${C.border}`, fontSize: 13,
                    outline: 'none', background: C.white,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── 生成ボタン ────────────────────────────────── */}
        <button
          onClick={generate}
          disabled={status === 'working'}
          style={{
            width: '100%', padding: '13px', borderRadius: 8,
            background: status === 'working' ? C.sub : C.accent,
            color: '#fff', border: 'none', fontSize: 15,
            fontWeight: 700, cursor: status === 'working' ? 'default' : 'pointer',
          }}
        >
          {status === 'working' ? `⏳ ${message}` : '📄 文書を生成する'}
        </button>

        {/* ── エラー ───────────────────────────────────── */}
        {status === 'error' && (
          <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 8, padding: '12px 16px', color: C.red, marginTop: 12, fontSize: 13 }}>
            ⚠ {message}
          </div>
        )}

        {/* ── 生成完了 ─────────────────────────────────── */}
        {status === 'done' && (
          <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 10, padding: '20px 24px', marginTop: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.green, marginBottom: 14 }}>
              ✅ 文書の生成が完了しました！
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href={docUrl} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, display: 'block', padding: '10px', borderRadius: 7, background: C.accent, color: '#fff', textAlign: 'center', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                📄 Google ドキュメントで開く
              </a>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, display: 'block', padding: '10px', borderRadius: 7, background: C.green, color: '#fff', textAlign: 'center', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                ↓ PDF ダウンロード
              </a>
            </div>
            <button onClick={() => { setStatus('idle'); setDocUrl(''); setPdfUrl(''); setMessage(''); }}
              style={{ marginTop: 10, width: '100%', padding: '8px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.white, color: C.sub, fontSize: 13, cursor: 'pointer' }}>
              新しい文書を作成
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <DocApp />
    </GoogleOAuthProvider>
  );
}
