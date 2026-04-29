import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "运费快速估算器 | OPTEC",
  description: "空运/OBC/快递运费实时估算，体积重自动计算",
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
