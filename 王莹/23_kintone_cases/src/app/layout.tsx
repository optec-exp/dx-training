import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "見積案件一覧 | OPTEC",
  description: "OPTEC 見積案件リスト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
