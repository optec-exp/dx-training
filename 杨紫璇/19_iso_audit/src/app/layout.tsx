import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ISO内部审计检查清单 | OPTEC",
  description: "山东上星国际货运代理有限公司 ISO 9001:2015 内部审计检查清单",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
