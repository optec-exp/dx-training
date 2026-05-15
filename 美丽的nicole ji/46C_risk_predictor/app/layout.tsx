import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 案件风险预测",
  description: "从Supabase读取案件，AI预测延迟风险并推送Slack通知",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
