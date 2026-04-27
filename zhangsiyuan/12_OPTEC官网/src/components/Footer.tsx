// 组件拆分：Footer 是独立组件，被 layout.tsx 引用
// 这个组件只负责"展示"，不需要交互，所以不用写 'use client'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer">
      <Link href="/" className="footer-logo">
        OPTEC <em>EXPRESS</em>
      </Link>
      <nav className="footer-nav">
        <Link href="/about">会社概要</Link>
        <Link href="/services">サービス</Link>
        <Link href="/contact">お問合せ</Link>
      </nav>
      <small>© 2026 OPTEC Express. Tokyo HQ · Global Logistics · 作品 #12</small>
    </footer>
  )
}
