import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAPA 追踪看板 | OPTEC",
  description: "纠正与预防措施进度管理",
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
