import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "物品管理应用 | OPTEC",
  description: "公司物品借出管理系统",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
