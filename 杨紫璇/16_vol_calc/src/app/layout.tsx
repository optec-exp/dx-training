import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OPTEC Express — 体积重量计算工具",
  description: "输入货物三边尺寸与实际重量，自动对比体积重量与实际重量，确认计费基准。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
