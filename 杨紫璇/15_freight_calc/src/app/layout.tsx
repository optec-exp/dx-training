import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OPTEC Express — 航空货运费用模拟器",
  description: "输入货物重量与目的地区域，即时获取航空运输费用估算。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
