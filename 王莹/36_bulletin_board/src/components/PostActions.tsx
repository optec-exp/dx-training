'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PostActions({ postId }: { postId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm('确定要删除这个帖子吗？此操作不可撤销。')) return;
    setDeleting(true);

    const supabase = createClient();
    const { error } = await supabase.from('bb_posts').delete().eq('id', postId);

    if (error) {
      alert('删除失败：' + error.message);
      setDeleting(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Link
        href={`/posts/${postId}/edit`}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
      >
        ✏️ 编辑
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
      >
        {deleting ? '删除中…' : '🗑 删除'}
      </button>
    </div>
  );
}
