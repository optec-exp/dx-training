import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "温度管理异常记录器 | OPTEC",
  description: "冷链货物温度超标快速记录与分析",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
