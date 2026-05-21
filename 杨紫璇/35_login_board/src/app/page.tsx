import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import PostForm from './PostForm'
import PostCard from './PostCard'
import LogoutButton from './LogoutButton'

type Comment = {
  id: number
  created_at: string
  user_id: string
  content: string
}

type Post = {
  id: number
  created_at: string
  user_id: string
  title: string
  content: string
  comments: Comment[]
}

export default async function Home() {
  const supabase = await createClient()

  const [{ data: { user } }, { data, error }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('posts')
      .select('*, comments(id, created_at, user_id, content)')
      .order('created_at', { ascending: false })
      .order('created_at', { referencedTable: 'comments', ascending: true }),
  ])

  const posts = data as Post[] | null

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <main className="max-w-3xl mx-auto">
        <header className="mb-8 flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">公司内部公告板</h1>
            <p className="text-sm text-zinc-500 mt-1">
              共 {posts?.length ?? 0} 条帖子
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <>
                <span className="text-sm text-zinc-600">
                  已登录 <span className="font-medium">{user.email}</span>
                </span>
                <LogoutButton />
              </>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm bg-zinc-900 text-white rounded hover:bg-zinc-700"
              >
                请登录
              </Link>
            )}
          </div>
        </header>

        {user ? (
          <PostForm />
        ) : (
          <div className="mb-8 p-4 bg-white border border-zinc-200 rounded text-center text-sm text-zinc-500">
            <Link href="/login" className="text-zinc-900 font-medium hover:underline">
              请先登录
            </Link>
            {' '}
            才能发帖
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            读取失败：{error.message}
          </div>
        )}

        {!error && posts && posts.length === 0 && (
          <div className="p-8 bg-white border border-zinc-200 rounded text-center text-zinc-500">
            还没有帖子
          </div>
        )}

        <ul className="space-y-4">
          {posts?.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id ?? null}
            />
          ))}
        </ul>
      </main>
    </div>
  )
}
