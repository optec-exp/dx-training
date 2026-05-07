'use client';

// ── 知識ポイント：SessionProvider ────────────────────────
// NextAuth の useSession フックを使うには、
// アプリ全体を SessionProvider でラップする必要がある。
// 'use client' が必要なので layout.tsx から分離した。

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
