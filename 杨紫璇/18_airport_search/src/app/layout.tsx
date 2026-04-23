import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OPTEC Express — 机场代码搜索工具",
  description: "输入 IATA/ICAO 机场代码，即时查询机场名称、所在国家与位置地图。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
