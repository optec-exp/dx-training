import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kintone + Slack 通知フォーム | OPTEC",
  description: "登録後に Slack へ通知を送信するフォーム",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
