import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "时区转换工具 | OPTEC",
  description: "OPTEC 国际业务时区转换工具",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
