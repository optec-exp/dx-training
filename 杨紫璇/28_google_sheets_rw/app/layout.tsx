import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Google Sheets 読書 | OPTEC",
  description: "Google Spreadsheet を簡易DBとして読み書きする",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
