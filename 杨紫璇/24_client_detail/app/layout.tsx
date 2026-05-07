import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kintone 客户列表 | OPTEC",
  description: "客户列表 · 案件历史详情",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
