import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type PostListItem = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  author: { display_name: string } | null;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function Home() {
  const supabase = await createClient();

  const [{ data: userData }, { data: postsData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('bb_posts')
      .select('id, title, content, created_at, user_id, author:bb_profiles ( display_name )')
      .order('created_at', { ascending: false }),
  ]);

  const user = userData.user;
  const posts = (postsData ?? []) as unknown as PostListItem[];

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">📋 公告列表</h1>
        {user && (
          <Link
            href="/posts/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            + 新建帖子
          </Link>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-6">
        {user
          ? '点击下方帖子可以查看详情与评论。'
          : '未登录可浏览，登录后可发帖、评论。'}
      </p>

      {posts.length === 0 ? (
        <p className="text-gray-500 border border-dashed border-gray-300 rounded p-8 text-center">
          暂无帖子
        </p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/posts/${post.id}`}
                className="block border border-gray-200 rounded-lg p-4 bg-white hover:border-blue-400 hover:shadow-sm transition"
              >
                <h2 className="text-lg font-semibold mb-1">{post.title}</h2>
                <p className="text-xs text-gray-500 mb-2">
                  作者：<strong>{post.author?.display_name ?? '未知用户'}</strong>
                  {' · '}
                  {formatTime(post.created_at)}
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                  {post.content}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
