'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';

export default function CommentForm({ postId }: { postId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: insertError } = await supabase.from('bb_comments').insert({
      post_id: postId,
      user_id: user.id,
      content: content.trim(),
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setContent('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <textarea
        required
        minLength={1}
        maxLength={2000}
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2"
        placeholder="发表评论…"
      />
      {error && (
        <p className="text-red-600 text-sm border border-red-300 bg-red-50 rounded px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? '提交中…' : '发表评论'}
        </button>
        <span className="text-xs text-gray-400">{content.length} / 2000</span>
      </div>
    </form>
  );
}
