import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "販管費申請システム",
  description: "費用申請 → 審批通知 → 台账記録",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className="bg-slate-50 min-h-screen">{children}</body>
    </html>
  );
}
