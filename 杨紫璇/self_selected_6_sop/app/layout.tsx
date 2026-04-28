import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOP文件版本管理清单 | OPTEC",
  description: "作业规程的版本与有效期追踪",
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
