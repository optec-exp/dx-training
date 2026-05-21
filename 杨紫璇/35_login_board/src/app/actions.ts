'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()

  if (!title || !content) {
    return { error: '标题和内容都不能为空' }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: '请先登录' }
  }

  // 不传 user_id —— posts 表的默认值 auth.uid() 会自动填入当前登录用户
  const { error } = await supabase.from('posts').insert({ title, content })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}

export async function deletePost(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('posts').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}

export async function deleteComment(id: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('comments').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}

export async function createComment(postId: number, formData: FormData) {
  const content = String(formData.get('content') ?? '').trim()

  if (!content) {
    return { error: '评论内容不能为空' }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: '请先登录' }
  }

  // 不传 user_id —— comments 表的默认值 auth.uid() 自动填入
  const { error } = await supabase
    .from('comments')
    .insert({ post_id: postId, content })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}

export async function updatePost(id: number, formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()

  if (!title || !content) {
    return { error: '标题和内容都不能为空' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('posts')
    .update({ title, content })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}
