import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OPTEC Express — Air Cargo China 2026",
  description: "OPTEC Express at Air Cargo China 2026 | Hall E1, Booth 523 | June 10–12, Shanghai",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
