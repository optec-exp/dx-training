'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [conversations, setConversations] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false })
    if (error) {
      console.error('加载会话列表失败：', error)
      return
    }
    setConversations(data || [])
  }

  async function switchConversation(id) {
    if (id === conversationId || loading) return
    setConversationId(id)
    setMessages([])
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', id)
      .order('id', { ascending: true })
    setLoading(false)
    if (error) {
      console.error('加载消息失败：', error)
      return
    }
    setMessages(data || [])
  }

  function newConversation() {
    if (loading) return
    setConversationId(null)
    setMessages([])
    setInput('')
  }

  async function generateTitle(convId, userMsg, aiMsg) {
    try {
      const res = await fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: userMsg, aiReply: aiMsg }),
      })
      const data = await res.json()
      if (data.title) {
        await supabase
          .from('conversations')
          .update({ title: data.title })
          .eq('id', convId)
        loadConversations()
      }
    } catch (err) {
      console.error('生成标题失败：', err)
    }
  }

  async function handleSend(presetText) {
    const text = (presetText ?? input).trim()
    if (!text || loading) return

    const userMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const isFirstTurn = !conversationId

    try {
      let convId = conversationId
      if (!convId) {
        const { data, error } = await supabase
          .from('conversations')
          .insert({})
          .select()
          .single()
        if (error) throw new Error('创建会话失败：' + error.message)
        convId = data.id
        setConversationId(convId)
      }

      const { error: userMsgError } = await supabase.from('messages').insert({
        conversation_id: convId,
        role: 'user',
        content: text,
      })
      if (userMsgError) throw new Error('保存用户消息失败：' + userMsgError.message)

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `请求失败 (${res.status})`)
      }

      setMessages([...newMessages, { role: 'assistant', content: '' }])

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullReply = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullReply += chunk
        setMessages([...newMessages, { role: 'assistant', content: fullReply }])
      }

      const { error: aiMsgError } = await supabase.from('messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: fullReply,
      })
      if (aiMsgError) throw new Error('保存 AI 回复失败：' + aiMsgError.message)

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', convId)

      loadConversations()

      if (isFirstTurn) {
        generateTitle(convId, text, fullReply)
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: '出错了：' + err.message }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function formatTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const exampleQuestions = [
    '年假怎么算？',
    '报销流程是怎样的？',
    'IT 设备坏了找谁？',
    '公司价值观是什么？',
  ]

  const showThinking = loading && messages[messages.length - 1]?.role !== 'assistant'

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-3 border-b border-gray-200">
          <button
            onClick={newConversation}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建会话
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {conversations.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-6 px-4">
              暂无历史会话<br />
              <span className="text-xs">开始对话后会显示在这里</span>
            </p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => switchConversation(c.id)}
              className={`w-full text-left px-3 py-2.5 mx-2 my-0.5 rounded-lg transition-colors ${
                c.id === conversationId
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-100 border border-transparent'
              }`}
              style={{ width: 'calc(100% - 1rem)' }}
            >
              <div className={`text-sm font-medium truncate ${
                c.id === conversationId ? 'text-blue-700' : 'text-gray-800'
              }`}>
                {c.title || '新会话'}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {formatTime(c.updated_at)}
              </div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-gray-200 text-xs text-gray-400 text-center">
          OPTEC AI Academy · 作品 38
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">OPTEC 内部 FAQ 助手</h1>
          <p className="text-sm text-gray-500 mt-0.5">基于公司知识库，回答规章、流程、制度相关问题</p>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">你好！我是 OPTEC FAQ 助手</h2>
                <p className="text-sm text-gray-500 mb-6">可以问我关于公司规则、流程、制度的问题</p>
                <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                  {exampleQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="text-sm text-left px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl whitespace-pre-wrap shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                  }`}
                >
                  {msg.content || (
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                  )}
                </div>
              </div>
            ))}

            {showThinking && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题，按 Enter 发送..."
              disabled={loading}
              className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-gray-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-full font-medium shadow-sm hover:shadow-md hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发送
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
