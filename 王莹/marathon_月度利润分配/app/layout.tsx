import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "月度利润自动分配",
  description: "Air/SEA/EC 案件月度利润计算与分配（取代人工计算）",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className="bg-slate-50 min-h-screen text-slate-900">
        {children}
      </body>
    </html>
  );
}
