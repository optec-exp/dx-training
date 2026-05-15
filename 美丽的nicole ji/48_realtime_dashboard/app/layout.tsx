import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "实时通知仪表盘",
  description: "Supabase Realtime + Slack",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
