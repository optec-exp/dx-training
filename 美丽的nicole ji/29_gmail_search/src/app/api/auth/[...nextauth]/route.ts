// ── 知识点：NextAuth.js + OAuth2 ────────────────────────
//
// OAuth2 の流れ：
// 1. ユーザーが「Googleでログイン」をクリック
// 2. Google の同意画面にリダイレクト
// 3. ユーザーが「許可」をクリック
// 4. Google が access_token を返す
// 5. NextAuth がセッションに保存
// 6. access_token で Gmail API を呼び出す
//
// [...nextauth] = 動的ルート（catch-all）
// /api/auth/signin, /api/auth/callback/google などを全部このファイルで処理

import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Gmail を読み取るための権限（スコープ）を要求
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.readonly',
          ].join(' '),
          // 毎回 refresh_token を取得するため
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],

  callbacks: {
    // ── jwt コールバック：トークンをセッションに保存 ────
    // Google から受け取った access_token を JWT に詰める
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    // ── session コールバック：フロントに渡す ───────────
    // JWT の accessToken をフロントエンドから使えるようにする
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
