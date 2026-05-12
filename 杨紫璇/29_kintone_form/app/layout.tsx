import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kintone 案件登録 | OPTEC",
  description: "新規案件をKintoneに登録するフォーム",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
