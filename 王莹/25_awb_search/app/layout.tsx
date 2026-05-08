import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AWB 実绩搜索 | OPTEC",
  description: "AWB 実绩数据按期间・客户・状态筛选",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-[#06111f] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
