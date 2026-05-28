import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "商务邮件三语草稿助手",
  description: "输入要点，自动生成日语 / 英语 / 中文三版商务邮件草稿",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
