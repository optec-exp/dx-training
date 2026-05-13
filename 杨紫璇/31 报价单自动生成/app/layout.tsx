import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "報価単自動生成 | OPTEC",
  description: "Kintone の案件情報から報価単 PDF を自動生成",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
