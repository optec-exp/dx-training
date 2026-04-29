import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "三语邮件模板生成器 | OPTEC",
  description: "中/日/英三语邮件模板，5种邮件类型",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
