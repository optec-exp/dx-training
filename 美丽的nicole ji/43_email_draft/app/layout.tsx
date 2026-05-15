import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 邮件草稿助手",
  description: "输入要点，自动生成日/英/中三版商务邮件",
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
