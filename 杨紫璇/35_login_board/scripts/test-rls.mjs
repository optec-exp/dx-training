// 用法（在项目根目录执行）：
//   node --env-file=.env.local scripts/test-rls.mjs
//
// 这个脚本会"扮演攻击者"，绕过 React UI 直接调 Supabase REST API，
// 演示 RLS 如何在数据库层拦截各种越权操作。

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('❌ 找不到环境变量。请用：node --env-file=.env.local scripts/test-rls.mjs')
  process.exit(1)
}

const line = '─'.repeat(60)
const log = (msg) => console.log(msg)
const pass = (msg) => console.log('  ✅', msg)
const fail = (msg) => console.log('  ❌', msg)

// ════════════════════════════════════════════════════════════
log('\n' + line)
log('🕵️  测试 1：匿名用户（未登录）的能力边界')
log(line)

const anon = createClient(url, anonKey)

// 1a. 匿名能读 posts 吗？应该能（SELECT public 策略）
{
  const { data, error } = await anon.from('posts').select('id, title').limit(3)
  if (error) fail(`SELECT 失败：${error.message}`)
  else pass(`SELECT 成功，读到 ${data.length} 条帖子 → SELECT public 策略生效`)
}

// 1b. 匿名能发帖吗？应该不行（INSERT 要求 authenticated）
{
  const { error } = await anon.from('posts').insert({ title: '匿名栽赃', content: 'hack' })
  if (error) pass(`INSERT 被拒：${error.message}`)
  else fail('💥 漏洞！匿名居然能 INSERT！请检查 posts INSERT 策略')
}

// ════════════════════════════════════════════════════════════
log('\n' + line)
log('🕵️  测试 2：登录 A，尝试越权改/删 B 的帖子')
log(line)

const aClient = createClient(url, anonKey)
const { error: signInError } = await aClient.auth.signInWithPassword({
  email: 'test-a@example.com',
  password: 'test1234',
})
if (signInError) {
  fail(`登录 A 失败：${signInError.message}（请确认测试账号存在）`)
  process.exit(1)
}
pass('A 登录成功')

// 找一条 B 的帖子（B 的 UID 以 d57 开头）
const { data: allPosts } = await aClient
  .from('posts')
  .select('id, title, user_id')
const bPost = allPosts?.find((p) => p.user_id.startsWith('d57d158e'))

if (!bPost) {
  fail('数据库里没找到 B 发的帖子。请先用 B 账号登录并发一条，再跑此脚本。')
  process.exit(1)
}
log(`  📌 目标：B 的帖子 id=${bPost.id} 标题="${bPost.title}"`)

// 2a. A 试图改 B 的帖子标题
{
  await aClient
    .from('posts')
    .update({ title: '🔥 A 篡改了 B 的标题 🔥' })
    .eq('id', bPost.id)

  // ⚠️ RLS 阻止 UPDATE 时不报错，是"静默成功 0 行"。要靠重新读验证。
  const { data: after } = await aClient
    .from('posts')
    .select('title')
    .eq('id', bPost.id)
    .single()

  if (after.title === bPost.title) {
    pass(`UPDATE 被 RLS 静默拦截，标题仍是"${bPost.title}"`)
  } else {
    fail(`💥 漏洞！标题被改成了"${after.title}"`)
  }
}

// 2b. A 试图删 B 的帖子
{
  await aClient.from('posts').delete().eq('id', bPost.id)

  const { data: stillThere } = await aClient
    .from('posts')
    .select('id')
    .eq('id', bPost.id)
    .maybeSingle()

  if (stillThere) {
    pass(`DELETE 被 RLS 静默拦截，B 的帖子还活着`)
  } else {
    fail(`💥 漏洞！B 的帖子被 A 删掉了`)
  }
}

// ════════════════════════════════════════════════════════════
log('\n' + line)
log('🕵️  测试 3：栽赃测试 —— A 假冒 B 的身份发评论')
log(line)
log('（这一项展示了为什么 comments 用了更严格的 user_id 模板）\n')

// 找一个真实的 B 的 UID
const bUserId = bPost.user_id

// 3. A 尝试插一条 comment 但 user_id 填 B 的
{
  const { error } = await aClient.from('comments').insert({
    post_id: bPost.id,
    user_id: bUserId,
    content: '这是 A 假装 B 写的',
  })
  if (error) {
    pass(`INSERT comments 被拒：${error.message}`)
    log('     → 这是 comments INSERT 策略 (auth.uid() = user_id) 生效')
  } else {
    fail('💥 漏洞！comments INSERT 没拦住栽赃')
  }
}

// 对比：A 尝试假冒 B 发帖（posts 用的是较宽松的策略）
{
  const { error } = await aClient.from('posts').insert({
    title: 'A 假装 B 发的',
    content: 'forged',
    user_id: bUserId,
  })
  if (error) {
    pass(`posts INSERT 也拒了：${error.message}（你可能已经升级了 posts 策略）`)
  } else {
    fail(`⚠️  posts INSERT 没拦住栽赃 —— 这就是为什么建议把 posts INSERT 也升级成 user_id 模板`)
    // 清理痕迹
    await aClient.from('posts').delete().eq('title', 'A 假装 B 发的').eq('user_id', bUserId)
  }
}

// ════════════════════════════════════════════════════════════
log('\n' + line)
log('🕵️  测试 4：A 能正常操作自己的帖子')
log(line)

// 找一条 A 的帖子
const aPost = allPosts?.find((p) => p.user_id.startsWith('7e19239c'))
if (aPost) {
  const original = aPost.title
  await aClient.from('posts').update({ title: original + ' [test]' }).eq('id', aPost.id)
  const { data: after } = await aClient.from('posts').select('title').eq('id', aPost.id).single()
  if (after.title === original + ' [test]') {
    pass(`A 改自己的帖子成功（"${original}" → "${after.title}"）`)
    // 恢复原标题
    await aClient.from('posts').update({ title: original }).eq('id', aPost.id)
    log('     → 已恢复原标题')
  } else {
    fail('💥 A 居然改不了自己的帖子，策略可能有问题')
  }
}

await aClient.auth.signOut()
log('\n' + line)
log('✨ 测试结束。所有 ✅ 表示 RLS 工作正常，所有 ❌ 是需要关注的漏洞。')
log(line + '\n')
