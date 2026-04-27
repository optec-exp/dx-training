import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "航司 / 供应商品质评分表 | OPTEC",
  description: "每次合作后留存评分记录",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
