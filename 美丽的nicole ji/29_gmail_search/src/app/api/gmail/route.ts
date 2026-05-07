import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// ── Gmail API を呼ぶサーバーサイドルート ────────────────
// フロントから accessToken を受け取り、Gmail API を呼ぶ
// （accessToken はサーバー側でも getServerSession で取れるが、
//   シンプルにするためフロントから渡してもらう）

export async function GET(req: NextRequest) {
  const p      = req.nextUrl.searchParams;
  const token  = p.get('token')  ?? '';   // access_token
  const query  = p.get('query')  ?? '';   // 検索キーワード
  const msgId  = p.get('msgId')  ?? '';   // メール本文取得用 ID

  if (!token) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }

  const headers = { Authorization: `Bearer ${token}` };

  try {
    // ── メール本文取得モード ─────────────────────────
    if (msgId) {
      const res  = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`,
        { headers }
      );
      if (!res.ok) {
        return NextResponse.json({ error: await res.text() }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json({ message: data });
    }

    // ── メール一覧検索モード ─────────────────────────
    // Gmail の検索は Google 検索と同じ構文が使える
    // 例: "from:xxx@gmail.com", "subject:請求書", "after:2024/01/01"
    const searchQuery = query || 'in:inbox';
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=20`,
      { headers }
    );

    if (!listRes.ok) {
      return NextResponse.json({ error: await listRes.text() }, { status: listRes.status });
    }

    const listData = await listRes.json();
    const messages = listData.messages ?? [];

    // 各メールのヘッダー情報を取得（件名・差出人・日付）
    const details = await Promise.all(
      messages.map(async (m: { id: string }) => {
        const r = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers }
        );
        if (!r.ok) return null;
        const d = await r.json();

        // ヘッダーを Map に変換
        const hMap: Record<string, string> = {};
        (d.payload?.headers ?? []).forEach((h: { name: string; value: string }) => {
          hMap[h.name] = h.value;
        });

        return {
          id:      d.id,
          subject: hMap['Subject'] ?? '（件名なし）',
          from:    hMap['From']    ?? '',
          date:    hMap['Date']    ?? '',
          snippet: d.snippet       ?? '',
        };
      })
    );

    return NextResponse.json({ emails: details.filter(Boolean) });

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '请求失败' },
      { status: 500 }
    );
  }
}
