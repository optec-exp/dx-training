import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CommentForm from '@/components/CommentForm';
import PostActions from '@/components/PostActions';
import CommentDeleteButton from '@/components/CommentDeleteButton';

type Post = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  author: { display_name: string } | null;
};

type Comment = {
  id: string;
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

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: userData }, { data: postData }, { data: commentsData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('bb_posts')
      .select('id, title, content, created_at, user_id, author:bb_profiles ( display_name )')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('bb_comments')
      .select('id, content, created_at, user_id, author:bb_profiles ( display_name )')
      .eq('post_id', id)
      .order('created_at', { ascending: true }),
  ]);

  if (!postData) {
    notFound();
  }

  const user = userData.user;
  const post = postData as unknown as Post;
  const comments = (commentsData ?? []) as unknown as Comment[];

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← 回列表
      </Link>

      <article className="mt-4 border border-gray-200 rounded-lg p-6 bg-white">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-2xl font-bold">{post.title}</h1>
          {user?.id === post.user_id && <PostActions postId={post.id} />}
        </div>
        <p className="text-xs text-gray-500 mb-4">
          作者：<strong>{post.author?.display_name ?? '未知用户'}</strong>
          {' · '}
          发布于 {formatTime(post.created_at)}
        </p>
        <div className="text-base text-gray-800 whitespace-pre-wrap">{post.content}</div>
      </article>

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-3">💬 评论（{comments.length}）</h2>

        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 border border-dashed border-gray-300 rounded p-6 text-center">
            还没有评论，{user ? '抢沙发吧！' : '登录后可发表评论。'}
          </p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs text-gray-500">
                    <strong>{c.author?.display_name ?? '未知用户'}</strong>
                    {' · '}
                    {formatTime(c.created_at)}
                  </p>
                  {user?.id === c.user_id && <CommentDeleteButton commentId={c.id} />}
                </div>
                <p className="text-sm whitespace-pre-wrap">{c.content}</p>
              </li>
            ))}
          </ul>
        )}

        {user ? (
          <CommentForm postId={post.id} />
        ) : (
          <p className="mt-6 text-sm text-gray-500">
            <Link href="/login" className="text-blue-600 hover:underline">
              登录
            </Link>{' '}
            后可发表评论。
          </p>
        )}
      </section>
    </main>
  );
}
