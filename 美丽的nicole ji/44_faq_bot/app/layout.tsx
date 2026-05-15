import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "社内 FAQ ボット",
  description: "公司内部FAQ问答机器人",
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
