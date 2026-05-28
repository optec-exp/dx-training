'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';

export default function NewPostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: insertError } = await supabase.from('bb_posts').insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push('/');
    router.refresh();
  }

  if (authLoading) {
    return <main className="p-8 text-gray-500">加载中…</main>;
  }
  if (!user) {
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-60px)] p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📝 新建帖子</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            标题（1-200 字）
          </label>
          <input
            id="title"
            type="text"
            required
            minLength={1}
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="一句话标题"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-1">
            正文（1-10000 字）
          </label>
          <textarea
            id="content"
            required
            minLength={1}
            maxLength={10000}
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 font-sans"
            placeholder="正文内容…"
          />
          <p className="text-xs text-gray-400 mt-1">已输入 {content.length} 字</p>
        </div>

        {error && (
          <p className="text-red-600 text-sm border border-red-300 bg-red-50 rounded px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? '发布中…' : '发布'}
          </button>
          <Link
            href="/"
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            取消
          </Link>
        </div>
      </form>
    </main>
  );
}
