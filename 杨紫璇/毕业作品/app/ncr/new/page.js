'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOwner, calcAllDues } from '@/lib/sla'
import { toast } from '@/lib/ui'

const CATEGORIES = ['客户案件', '内部']
const MODES = ['空运', '海运']
const DEPARTMENTS = ['空运操作部', '海运操作部', '客服部', '报关部', '仓储部', '销售部']
const PROBLEM_TYPES = ['延误', '错配/装错', '货损', '报关清关', '危险品申报', '信息泄露', '客户投诉/中断', '其他']
const SEVERITIES = ['S1', 'S2', 'S3', 'S4']

const SEVERITY_STYLE = {
  S4: 'bg-red-100 text-red-700',
  S3: 'bg-orange-100 text-orange-700',
  S2: 'bg-yellow-100 text-yellow-700',
  S1: 'bg-slate-100 text-slate-600',
}

export default function NewNCRPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [form, setForm] = useState({
    occur_at: new Date().toISOString().slice(0, 16),
    category: '客户案件',
    transport_mode: '空运',
    department: '',
    customer: '',
    problem_type: '',
    severity: '',
    summary: '',
    economic_loss: '',
  })

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSuggest() {
    if (!form.summary) return
    setSuggesting(true)
    setError(null)
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: form.summary,
          category: form.category,
          customer: form.customer,
          transport_mode: form.transport_mode,
          department: form.department,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI 建议失败')
      setSuggestion(data)
      setForm((f) => ({ ...f, problem_type: data.problem_type, severity: data.severity }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSuggesting(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        occur_at: form.occur_at ? new Date(form.occur_at).toISOString() : null,
        occur_date: form.occur_at ? form.occur_at.slice(0, 10) : null,
        category: form.category,
        transport_mode: form.transport_mode,
        department: form.department || null,
        customer: form.customer || null,
        problem_type: form.problem_type || null,
        severity: form.severity || null,
        severity_auto: suggestion?.severity || null,
        severity_final: form.severity || null,
        assignee: getOwner(form.department, form.severity),
        containment_owner: getOwner(form.department, form.severity),
        root_cause_owner: getOwner(form.department, form.severity),
        corrective_owner: getOwner(form.department, form.severity),
        preventive_owner: getOwner(form.department, form.severity),
        ...calcAllDues(form.severity, form.occur_at),
        summary: form.summary,
        economic_loss: form.economic_loss === '' ? null : Number(form.economic_loss),
        status: 'open',
        source: 'manual',
      }
      const { error } = await supabase.from('ncr_records').insert(payload)
      if (error) throw new Error(error.message)
      toast.success('已录入新 NCR')
      router.push('/')
    } catch (err) {
      setError(err.message)
      toast.error('提交失败:' + err.message)
      setSubmitting(false)
    }
  }

  const aiModified =
    suggestion &&
    (suggestion.problem_type !== form.problem_type || suggestion.severity !== form.severity)

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">录入新 NCR</h1>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <Field label="发生日期时间" required hint="精确到分钟,用于 SLA 推算">
            <input
              type="datetime-local"
              required
              value={form.occur_at}
              onChange={(e) => update('occur_at', e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="分类" required>
              <Select value={form.category} options={CATEGORIES} onChange={(v) => update('category', v)} />
            </Field>
            <Field label="输送领域" required>
              <Select value={form.transport_mode} options={MODES} onChange={(v) => update('transport_mode', v)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="发生部门" required>
              <Select
                value={form.department}
                options={DEPARTMENTS}
                onChange={(v) => update('department', v)}
                placeholder="请选择部门"
                required
              />
            </Field>
            <Field label="客户" hint="内部案件可留空">
              <input
                type="text"
                value={form.customer}
                onChange={(e) => update('customer', e.target.value)}
                placeholder="如:A 公司"
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
            </Field>
          </div>

          <Field label="事件概要" required>
            <textarea
              required
              rows={4}
              value={form.summary}
              onChange={(e) => update('summary', e.target.value)}
              placeholder="简要描述发生了什么、影响如何…"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </Field>

          <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                让 AI 根据概要建议「问题类型 + 严重度」
              </span>
              <button
                type="button"
                onClick={handleSuggest}
                disabled={suggesting || !form.summary}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {suggesting ? '判定中…' : 'AI 智能建议'}
              </button>
            </div>
            {suggestion ? (
              <div className="rounded-lg border border-blue-100 bg-white p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">AI 智能建议</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    来源:{suggestion.source === 'rule+ai' ? '规则+AI' : 'AI'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500">问题类型</div>
                    <div className="mt-1 inline-block rounded bg-blue-100 px-2.5 py-1 text-sm font-medium text-blue-700">
                      {suggestion.problem_type}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">严重度</div>
                    <div className={`mt-1 inline-block rounded px-2.5 py-1 text-sm font-medium ${SEVERITY_STYLE[suggestion.severity] || 'bg-slate-100 text-slate-600'}`}>
                      {suggestion.severity}
                    </div>
                  </div>
                </div>
                <div className="mt-3 border-t border-slate-100 pt-2">
                  <div className="text-xs text-slate-500">判断理由</div>
                  <p className="mt-1 text-sm text-slate-700">{suggestion.reason}</p>
                </div>
                {aiModified && (
                  <div className="mt-3 rounded bg-orange-50 px-3 py-2 text-xs text-orange-700">
                    ⚠️ 你已修改 AI 的建议(留痕保存,以便日后复盘)
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">填好「事件概要」后点按钮,AI 会建议下面两个字段(你随时可改)</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="问题类型" required>
              <Select
                value={form.problem_type}
                options={PROBLEM_TYPES}
                onChange={(v) => update('problem_type', v)}
                placeholder="请选择"
                required
              />
            </Field>
            <Field label="严重度" hint="可留空 / 或 AI 建议后人工确认">
              <Select
                value={form.severity}
                options={SEVERITIES}
                onChange={(v) => update('severity', v)}
                placeholder="请选择"
              />
            </Field>
          </div>

          <Field label="经济损失(元)" hint="可留空">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.economic_loss}
              onChange={(e) => update('economic_loss', e.target.value)}
              placeholder="如:5000"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </Field>

          {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">出错:{error}</div>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? '提交中…' : '提交录入'}
            </button>
            <Link
              href="/"
              className="rounded-md border border-slate-300 px-6 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              取消
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
        {hint && <span className="ml-2 text-xs font-normal text-slate-400">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function Select({ value, options, onChange, placeholder, required }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full rounded border border-slate-300 bg-white px-3 py-2"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}
