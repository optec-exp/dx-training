import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AWB 実績搜索 | OPTEC",
  description: "按期间・客户・状态多条件筛选 AWB 实绩，支持 CSV 导出",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
