import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "付款期限管理日历 | OPTEC",
  description: "付款期限管理，逾期与临近到期警告",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
