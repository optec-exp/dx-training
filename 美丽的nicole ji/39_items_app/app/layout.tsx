import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "物品管理",
  description: "公司物品借出管理应用",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
