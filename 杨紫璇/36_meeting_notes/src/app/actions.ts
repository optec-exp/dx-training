'use server'

import { createClient } from '@/utils/supabase/client'
import { revalidatePath } from 'next/cache'

type ActionItem = { owner: string; task: string; due: string }

type SaveInput = {
  title: string
  source_text: string
  summary: string
  action_items: ActionItem[]
}

// 判别联合 —— { ok: true, id } | { ok: false, error },TS 用 ok 字段自动收窄
type SaveResult =
  | { ok: true; id: number }
  | { ok: false; error: string }

export async function saveNote(input: SaveInput): Promise<SaveResult> {
  const supabase = createClient()

  const title =
    input.title.trim() || input.summary.slice(0, 20).trim() || '未命名会议'

  const { data, error } = await supabase
    .from('meeting_notes')
    .insert({
      title,
      source_text: input.source_text,
      summary: input.summary,
      action_items: input.action_items,
    })
    .select('id')
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/history')
  return { ok: true, id: data.id as number }
}

type DeleteResult =
  | { ok: true }
  | { ok: false; error: string }

export async function deleteNote(id: number): Promise<DeleteResult> {
  const supabase = createClient()
  const { error } = await supabase.from('meeting_notes').delete().eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/history')
  return { ok: true }
}
