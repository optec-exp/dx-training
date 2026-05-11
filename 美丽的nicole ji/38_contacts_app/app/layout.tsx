import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "社内通讯录",
  description: "公司内部员工通讯录管理应用",
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
