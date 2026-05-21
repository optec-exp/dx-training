import Link from 'next/link'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-8">
      <main className="w-full max-w-md">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">登录</h1>
          <p className="text-sm text-zinc-500 mt-1">
            登录后才能发帖和评论
          </p>
        </header>

        <LoginForm />

        <p className="text-center text-sm text-zinc-500 mt-4">
          <Link href="/" className="hover:text-zinc-900">
            ← 返回公告板
          </Link>
        </p>
      </main>
    </div>
  )
}
