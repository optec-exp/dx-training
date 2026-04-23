import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CellChain Logistics — 医薬品冷链专家",
  description: "CellChain Logistics by OPTEC Express. 超低温・冷藏・GDP合规全场景医药物流解决方案。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
