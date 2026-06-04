import type { Metadata } from "next";
import "./globals.css";
import Nav from "./_components/Nav";

export const metadata: Metadata = {
  title: "月度结算支援系统",
  description: "国际货代月度结算 / 对账 / 决算支援系统",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="layout">
          <Nav />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
