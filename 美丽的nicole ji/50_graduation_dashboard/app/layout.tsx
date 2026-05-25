import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "综合案件管理仪表盘",
  description: "Kintone + Supabase + Claude AI + Slack + Recharts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
