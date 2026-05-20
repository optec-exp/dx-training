import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "公司内部通讯录 | OPTEC",
  description: "员工通讯录管理应用",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
