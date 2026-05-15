import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "月度内审 Slack 自动提醒工具",
  description: "指定日期筛选 Kintone 内审任务 → 确认后触发 Slack 通知",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
