import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'sonner'
import Navbar from '@/components/Navbar'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "OPTEC QMS · 品质管理系统",
  description: "OPTEC 货代品质管理(NCR + CAPA 闭环)",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">
        <Navbar />
        {children}
        <Toaster position="top-right" richColors closeButton expand={false} />
      </body>
    </html>
  );
}
