import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NCR 自動登録システム | OPTEC",
  description: "NCR登録 → Kintone → Slack通知 → Drive フォルダ作成",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
