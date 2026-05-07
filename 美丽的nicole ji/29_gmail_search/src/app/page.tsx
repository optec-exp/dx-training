'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

// ── 颜色常量 ──────────────────────────────────────────────
const C = {
  bg:      '#f5f7fa',
  white:   '#ffffff',
  primary: '#1a73e8',   // Google Blue
  text:    '#202124',
  sub:     '#5f6368',
  border:  '#dadce0',
  hover:   '#f1f3f4',
  red:     '#d93025',
};

// ── 型定義 ────────────────────────────────────────────────
interface Email {
  id:      string;
  subject: string;
  from:    string;
  date:    string;
  snippet: string;
}

interface MessagePart {
  mimeType: string;
  body:     { data?: string };
  parts?:   MessagePart[];
}

// Base64url デコード（Gmail API の本文は Base64url エンコードされている）
function decodeBase64(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(
      atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
  } catch { return '（本文を表示できません）'; }
}

// メール本文を再帰的に取り出す
function extractBody(part: MessagePart): string {
  if (part.mimeType === 'text/plain' && part.body?.data) {
    return decodeBase64(part.body.data);
  }
  if (part.parts) {
    for (const p of part.parts) {
      const text = extractBody(p);
      if (text) return text;
    }
  }
  return '';
}

// 差出人の名前部分だけ取り出す（"名前 <email>" → "名前"）
function parseName(from: string): string {
  const m = from.match(/^"?([^"<]+)"?\s*</);
  return m ? m[1].trim() : from.split('@')[0];
}

// 日付フォーマット
function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

// ── メインページ ──────────────────────────────────────────
export default function Home() {
  // ── useSession：ログイン状態を取得 ──────────────────
  // status: "loading" | "authenticated" | "unauthenticated"
  const { data: session, status } = useSession();

  const [query,    setQuery]    = useState('');
  const [emails,   setEmails]   = useState<Email[]>([]);
  const [selected, setSelected] = useState<string | null>(null);  // 選択中のメール ID
  const [body,     setBody]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [bodyLoad, setBodyLoad] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const accessToken = (session as any)?.accessToken ?? '';

  // ── メール検索 ────────────────────────────────────────
  const handleSearch = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    setBody('');

    const params = new URLSearchParams({ token: accessToken, query: query || 'in:inbox' });
    try {
      const res  = await fetch(`/api/gmail?${params}`);
      const json = await res.json();
      if (json.error) setError(json.error);
      else setEmails(json.emails ?? []);
    } catch { setError('网络错误'); }
    setLoading(false);
  };

  // ── メール本文取得 ────────────────────────────────────
  const handleSelect = async (id: string) => {
    if (selected === id) { setSelected(null); setBody(''); return; }
    setSelected(id);
    setBodyLoad(true);
    setBody('');

    const params = new URLSearchParams({ token: accessToken, msgId: id });
    try {
      const res  = await fetch(`/api/gmail?${params}`);
      const json = await res.json();
      if (json.message?.payload) {
        setBody(extractBody(json.message.payload) || json.message.snippet || '（本文なし）');
      }
    } catch { setBody('本文の取得に失敗しました'); }
    setBodyLoad(false);
  };

  // ── ローディング中 ────────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <div style={{ color: C.sub }}>読み込み中...</div>
      </div>
    );
  }

  // ── 未ログイン画面 ────────────────────────────────────
  if (status === 'unauthenticated') {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: C.bg, fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✉</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          Gmail 搜索应用
        </h1>
        <p style={{ color: C.sub, marginBottom: 32, fontSize: 14 }}>
          用 Google 账号登录来搜索你的邮件
        </p>
        <button
          onClick={() => signIn('google')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 24px', borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.white, color: C.text,
            fontSize: 15, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,.12)',
          }}
        >
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

  // ── ログイン済み画面 ──────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>

      {/* ヘッダー */}
      <header style={{
        background: C.white, borderBottom: `1px solid ${C.border}`,
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,.08)',
      }}>
        <span style={{ fontSize: 20 }}>✉</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Gmail 搜索</span>

        {/* ユーザー情報 */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {session?.user?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" width={28} height={28}
              style={{ borderRadius: '50%' }} />
          )}
          <span style={{ fontSize: 13, color: C.sub }}>{session?.user?.email}</span>
          <button
            onClick={() => signOut()}
            style={{
              padding: '4px 12px', borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.white, color: C.sub,
              fontSize: 13, cursor: 'pointer',
            }}
          >
            ログアウト
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>

        {/* 検索バー */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 16,
        }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder='検索キーワード（例: from:xxx@gmail.com  subject:請求書）'
            style={{
              flex: 1, padding: '10px 14px',
              borderRadius: 8, border: `1px solid ${C.border}`,
              fontSize: 14, outline: 'none', background: C.white,
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '10px 20px', borderRadius: 8,
              background: C.primary, color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              opacity: loading ? .6 : 1,
            }}
          >
            {loading ? '検索中...' : '🔍 検索'}
          </button>
        </div>

        {/* エラー */}
        {error && (
          <div style={{
            background: '#fff2f0', border: '1px solid #ffccc7',
            borderRadius: 8, padding: '10px 14px', color: C.red, marginBottom: 12, fontSize: 13,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* メール一覧 */}
        {emails.length > 0 && (
          <div style={{
            background: C.white, borderRadius: 10,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
          }}>
            {emails.map((email, i) => (
              <div key={email.id}>
                <div
                  onClick={() => handleSelect(email.id)}
                  style={{
                    padding: '12px 16px', cursor: 'pointer',
                    borderBottom: i < emails.length - 1 ? `1px solid ${C.border}` : 'none',
                    background: selected === email.id ? '#e8f0fe' : C.white,
                    transition: 'background .1s',
                  }}
                  onMouseEnter={e => { if (selected !== email.id) e.currentTarget.style.background = C.hover; }}
                  onMouseLeave={e => { if (selected !== email.id) e.currentTarget.style.background = C.white; }}
                >
                  {/* 差出人 + 日付 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>
                      {parseName(email.from)}
                    </span>
                    <span style={{ fontSize: 12, color: C.sub }}>
                      {fmtDate(email.date)}
                    </span>
                  </div>
                  {/* 件名 */}
                  <div style={{ fontSize: 14, color: C.text, marginBottom: 3 }}>
                    {email.subject}
                  </div>
                  {/* スニペット */}
                  <div style={{
                    fontSize: 12, color: C.sub,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {email.snippet}
                  </div>
                </div>

                {/* 本文展開 */}
                {selected === email.id && (
                  <div style={{
                    padding: '16px 20px',
                    background: '#f8f9ff',
                    borderBottom: i < emails.length - 1 ? `1px solid ${C.border}` : 'none',
                    borderTop: `1px solid #c5cae9`,
                  }}>
                    {bodyLoad ? (
                      <div style={{ color: C.sub, fontSize: 13 }}>読み込み中...</div>
                    ) : (
                      <pre style={{
                        fontSize: 13, lineHeight: 1.7,
                        color: C.text, whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word', fontFamily: 'Arial, sans-serif',
                        maxHeight: 400, overflowY: 'auto',
                      }}>
                        {body}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 初期状態 */}
        {!loading && emails.length === 0 && !error && (
          <div style={{
            background: C.white, borderRadius: 10,
            padding: 48, textAlign: 'center', color: C.sub,
            border: `1px solid ${C.border}`,
          }}>
            キーワードを入力して検索してください
            <div style={{ fontSize: 12, marginTop: 8 }}>
              例：<code>from:xxx@gmail.com</code>　<code>subject:請求書</code>　<code>after:2024/01/01</code>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
