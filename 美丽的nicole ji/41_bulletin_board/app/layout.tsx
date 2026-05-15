import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "公司内部公告板",
  description: "需要登录才能发帖的公司内部公告板",
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
