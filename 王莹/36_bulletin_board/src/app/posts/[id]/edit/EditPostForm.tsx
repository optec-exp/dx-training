'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Props = {
  post: { id: string; title: string; content: string };
};

export default function EditPostForm({ post }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('bb_posts')
      .update({
        title: title.trim(),
        content: content.trim(),
      })
      .eq('id', post.id);

    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push(`/posts/${post.id}`);
    router.refresh();
  }

  return (
    <main className="min-h-[calc(100vh-60px)] p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">✏️ 编辑帖子</h1>

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
            {submitting ? '保存中…' : '保存'}
          </button>
          <Link
            href={`/posts/${post.id}`}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            取消
          </Link>
        </div>
      </form>
    </main>
  );
}
