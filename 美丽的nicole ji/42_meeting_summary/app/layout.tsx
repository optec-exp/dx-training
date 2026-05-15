import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 会议纪要摘要工具",
  description: "自动生成会议摘要和行动项",
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
