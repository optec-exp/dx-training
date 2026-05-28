import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EditPostForm from './EditPostForm';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: userData }, { data: postData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('bb_posts')
      .select('id, title, content, user_id')
      .eq('id', id)
      .maybeSingle(),
  ]);

  if (!postData) {
    notFound();
  }

  const user = userData.user;
  if (!user) {
    redirect('/login');
  }
  if (user.id !== postData.user_id) {
    redirect(`/posts/${id}`);
  }

  return <EditPostForm post={{ id: postData.id, title: postData.title, content: postData.content }} />;
}
