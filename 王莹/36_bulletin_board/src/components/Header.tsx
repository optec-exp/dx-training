'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold">
          📋 公告板
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {loading ? (
            <span className="text-gray-400">…</span>
          ) : user ? (
            <>
              <span className="text-gray-700">
                你好，<strong>{profile?.display_name ?? user.email}</strong>
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
              >
                登出
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
              >
                登录
              </Link>
              <Link
                href="/signup"
                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                注册
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
