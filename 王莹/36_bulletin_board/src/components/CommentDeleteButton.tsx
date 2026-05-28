'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CommentDeleteButton({ commentId }: { commentId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm('确定要删除这条评论吗？')) return;
    setDeleting(true);

    const supabase = createClient();
    const { error } = await supabase.from('bb_comments').delete().eq('id', commentId);

    if (error) {
      alert('删除失败：' + error.message);
      setDeleting(false);
      return;
    }

    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
      title="删除"
    >
      {deleting ? '删除中…' : '🗑'}
    </button>
  );
}
