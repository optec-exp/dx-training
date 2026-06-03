'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2, X as XIcon, CheckCircle2, AlertTriangle, FileText, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getStageStatus, SLA_LABELS, recomputeAllDues } from '@/lib/sla'
import { confirmToast, toast, Spinner } from '@/lib/ui'
import { notifySlack } from '@/lib/slack'

const severityStyle = {
  S4: 'bg-red-100 text-red-700',
  S3: 'bg-orange-100 text-orange-700',
  S2: 'bg-yellow-100 text-yellow-700',
  S1: 'bg-slate-100 text-slate-600',
}

const EFFECT_RESULTS = ['有效', '部分有效', '无效', '需追加CAPA']
const PROBLEM_TYPES = ['延误', '错配/装错', '货损', '报关清关', '危险品申报', '信息泄露', '客户投诉/中断', '其他']
const RESULT_STYLE = {
  '有效':       'bg-emerald-100 text-emerald-700',
  '部分有效':   'bg-yellow-100 text-yellow-700',
  '无效':       'bg-red-100 text-red-700',
  '需追加CAPA': 'bg-orange-100 text-orange-700',
}

function buildRootCauseText(ai) {
  if (!ai) return ''
  const chain = Array.isArray(ai.five_why_chain) ? ai.five_why_chain.filter(Boolean) : []
  return chain.length ? chain.join('\n') + '\n\n【根本原因】' + (ai.root_cause || '') : ai.root_cause || ''
}

export default function NCRDetailPage() {
  const params = useParams()
  const id = params?.id

  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 遏制
  const [suggesting, setSuggesting] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [editableActions, setEditableActions] = useState([])
  const [savingContainment, setSavingContainment] = useState(false)
  const [containmentError, setContainmentError] = useState(null)

  // CAPA
  const [capaSuggesting, setCapaSuggesting] = useState(false)
  const [capaSuggestion, setCapaSuggestion] = useState(null)
  const [rootCauseDraft, setRootCauseDraft] = useState('')
  const [correctiveDraft, setCorrectiveDraft] = useState('')
  const [preventiveDraft, setPreventiveDraft] = useState('')
  const [stageError, setStageError] = useState(null)
  const [savingStage, setSavingStage] = useState(null) // 'root' | 'corrPlan' | 'corrDone' | 'prevPlan' | 'prevDone' | null
  const [editingStage, setEditingStage] = useState(null) // 'rootCause' | 'corrPlan' | 'prevPlan' | null

  // 效果验证 + 结案
  const [effect30Draft, setEffect30Draft] = useState({ result: '', note: '' })
  const [effect90Draft, setEffect90Draft] = useState({ result: '', note: '' })
  const [closingCategory, setClosingCategory] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('ncr_records').select('*').eq('id', id).single()
    if (error) setError(error.message)
    else {
      setRecord(data)
      if (data?.containment_ai) {
        setAiSuggestion(data.containment_ai)
        if (!data.containment_at) {
          setEditableActions((data.containment_ai.actions || []).map((a) => ({ text: a, checked: false })))
        }
      }
      if (data?.capa_ai) {
        setCapaSuggestion(data.capa_ai)
        // 不在 load 时自动填 draft,等用户在对应 section 点击「获取 AI 建议」按钮才填
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    if (id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function updateOwner(field, currentValue) {
    const v = prompt(`输入新的负责人姓名(${field}):`, currentValue || '')
    if (v === null) return
    await supabase.from('ncr_records').update({ [field]: v }).eq('id', id)
    await load()
  }

  function handleDelete() {
    confirmToast(`删除 NCR #${record.id}?`, async () => {
      const { error } = await supabase.from('ncr_records').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      if (error) { toast.error('删除失败:' + error.message); return }
      toast.success('已删除,可在「已删除」中恢复')
      setTimeout(() => { window.location.href = '/' }, 800)
    }, { description: '数据保留在「已删除」页,可随时恢复', confirmLabel: '删除' })
  }

  async function updateSeverity() {
    const v = prompt('输入新的严重度(S1 / S2 / S3 / S4):', record.severity || '')
    if (v === null) return
    if (!['S1', 'S2', 'S3', 'S4'].includes(v)) {
      toast.error('严重度必须是 S1 / S2 / S3 / S4')
      return
    }
    const slaUpdates = recomputeAllDues(record, v)
    await supabase.from('ncr_records')
      .update({ severity: v, severity_final: v, ...slaUpdates })
      .eq('id', id)
    toast.success('严重度已更新,未完成阶段 SLA 已重算')
    await load()
  }

  // ===== 遏制 =====
  async function handleGetSuggestion() {
    setSuggesting(true)
    setContainmentError(null)
    try {
      const res = await fetch('/api/containment-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: record.summary, problem_type: record.problem_type, severity: record.severity,
          customer: record.customer, transport_mode: record.transport_mode, department: record.department,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '获取建议失败')
      setAiSuggestion(data)
      setEditableActions((data.actions || []).map((a) => ({ text: a, checked: false })))
      await supabase.from('ncr_records').update({ containment_ai: data }).eq('id', id)
    } catch (err) { setContainmentError(err.message) } finally { setSuggesting(false) }
  }
  const updateAction = (i, patch) => setEditableActions((arr) => arr.map((x, j) => j === i ? { ...x, ...patch } : x))
  const removeAction = (i) => setEditableActions((arr) => arr.filter((_, j) => j !== i))
  const addAction = () => setEditableActions((arr) => [...arr, { text: '', checked: true }])

  async function handleCompleteContainment() {
    const executed = editableActions.filter((a) => a.checked && a.text.trim())
    if (executed.length === 0) { setContainmentError('请至少勾选一条已执行的动作'); return }
    setSavingContainment(true); setContainmentError(null)
    try {
      const containmentText = executed.map((a, i) => `${i + 1}. ${a.text.trim()}`).join('\n')
      const { error } = await supabase.from('ncr_records').update({
        containment: containmentText, containment_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw new Error(error.message)
      await load()
    } catch (err) { setContainmentError(err.message) } finally { setSavingContainment(false) }
  }

  // ===== CAPA AI:各 section 各管各的;API 调用只在第一次,后续从缓存取 =====
  async function ensureCapa() {
    if (capaSuggestion) return capaSuggestion
    if (record?.capa_ai) { setCapaSuggestion(record.capa_ai); return record.capa_ai }
    setCapaSuggesting(true); setStageError(null)
    try {
      const res = await fetch('/api/capa-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: record.summary, problem_type: record.problem_type, severity: record.severity,
          customer: record.customer, transport_mode: record.transport_mode, department: record.department,
          containment: record.containment,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '获取建议失败')
      setCapaSuggestion(data)
      await supabase.from('ncr_records').update({ capa_ai: data }).eq('id', id)
      return data
    } catch (err) { setStageError(err.message); return null }
    finally { setCapaSuggesting(false) }
  }

  async function getRootCauseAi() {
    const data = await ensureCapa()
    if (data) setRootCauseDraft(buildRootCauseText(data))
  }
  async function getCorrectiveAi() {
    const data = await ensureCapa()
    if (data) setCorrectiveDraft(data.corrective_action || '')
  }
  async function getPreventiveAi() {
    const data = await ensureCapa()
    if (data) setPreventiveDraft(data.preventive_action || '')
  }

  // ===== 各阶段独立提交 =====
  async function submitRootCause() {
    if (!rootCauseDraft.trim()) { setStageError('根本原因不能为空'); return }
    setSavingStage('root'); setStageError(null)
    try {
      const { error } = await supabase.from('ncr_records').update({
        root_cause: rootCauseDraft, root_cause_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw new Error(error.message); await load()
    } catch (err) { setStageError(err.message) } finally { setSavingStage(null); setEditingStage(null) }
  }

  async function submitCorrectivePlan() {
    if (!correctiveDraft.trim()) { setStageError('纠正措施内容不能为空'); return }
    setSavingStage('corrPlan'); setStageError(null)
    try {
      const updates = {
        corrective_action: correctiveDraft,
        corrective_plan_at: new Date().toISOString(),
      }
      // 重新编辑方案 → 重置「已完成」状态,要求重新走标记完成,且重新记录完成时间
      if (editingStage === 'corrPlan' && record.corrective_done_at) {
        updates.corrective_done_at = null
      }
      const { error } = await supabase.from('ncr_records').update(updates).eq('id', id)
      if (error) throw new Error(error.message); await load()
    } catch (err) { setStageError(err.message) } finally { setSavingStage(null); setEditingStage(null) }
  }

  async function markCorrectiveDone() {
    setSavingStage('corrDone'); setStageError(null)
    try {
      const { error } = await supabase.from('ncr_records').update({
        corrective_done_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw new Error(error.message); await load()
    } catch (err) { setStageError(err.message) } finally { setSavingStage(null); setEditingStage(null) }
  }

  async function submitPreventivePlan() {
    if (!preventiveDraft.trim()) { setStageError('预防措施内容不能为空'); return }
    setSavingStage('prevPlan'); setStageError(null)
    try {
      const updates = {
        preventive_action: preventiveDraft,
        preventive_plan_at: new Date().toISOString(),
      }
      if (editingStage === 'prevPlan' && record.preventive_done_at) {
        updates.preventive_done_at = null
      }
      const { error } = await supabase.from('ncr_records').update(updates).eq('id', id)
      if (error) throw new Error(error.message); await load()
    } catch (err) { setStageError(err.message) } finally { setSavingStage(null); setEditingStage(null) }
  }

  async function markPreventiveDone() {
    setSavingStage('prevDone'); setStageError(null)
    try {
      const { error } = await supabase.from('ncr_records').update({
        preventive_done_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw new Error(error.message); await load()
    } catch (err) { setStageError(err.message) } finally { setSavingStage(null); setEditingStage(null) }
  }

  async function submitEffect30() {
    if (!effect30Draft.result) { setStageError('请选择 30 天验证结果'); return }
    setSavingStage('effect30'); setStageError(null)
    try {
      const { error } = await supabase.from('ncr_records').update({
        effect_30d_result: effect30Draft.result,
        effect_30d_note: effect30Draft.note || null,
        effect_30d_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw new Error(error.message); await load()
    } catch (err) { setStageError(err.message) } finally { setSavingStage(null) }
  }

  async function submitEffect90() {
    if (!effect90Draft.result) { setStageError('请选择 90 天验证结果'); return }
    setSavingStage('effect90'); setStageError(null)
    try {
      const { error } = await supabase.from('ncr_records').update({
        effect_90d_result: effect90Draft.result,
        effect_90d_note: effect90Draft.note || null,
        effect_90d_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw new Error(error.message); await load()
    } catch (err) { setStageError(err.message) } finally { setSavingStage(null) }
  }

  function handleCloseNCR() {
    if (!closingCategory) { setStageError('请选择根本原因类别'); return }
    confirmToast('确认结案?', async () => {
      setSavingStage('closing'); setStageError(null)
      const closedAt = new Date().toISOString()
      try {
        const { error } = await supabase.from('ncr_records').update({
          status: 'closed',
          closed_at: closedAt,
          root_cause_category: closingCategory,
        }).eq('id', id)
        if (error) throw new Error(error.message)
        toast.success('NCR 已结案')
        notifySlack('ncr_closed', {
          id,
          closed_at_text: new Date(closedAt).toLocaleString('zh-CN'),
          severity: record.severity,
          department: record.department,
          root_cause_category: closingCategory,
          summary: record.summary,
        })
        await load()
      } catch (err) { setStageError(err.message); toast.error(err.message) }
      finally { setSavingStage(null) }
    }, { description: '结案后将不再出现在待办列表', confirmLabel: '确认结案' })
  }

  if (loading) return <Wrapper><div className="flex items-center gap-2 text-sm text-slate-500"><Spinner /> 加载中…</div></Wrapper>
  if (error) return <Wrapper><div className="rounded bg-red-50 p-4 text-red-700">读取出错:{error}</div></Wrapper>
  if (!record) return <Wrapper><p className="text-sm text-slate-500">找不到这条 NCR</p></Wrapper>

  const containmentDone = !!record.containment_at
  const rootCauseDone = !!record.root_cause
  const correctivePlanDone = !!record.corrective_action
  const correctiveDoneDone = !!record.corrective_done_at
  const preventivePlanDone = !!record.preventive_action
  const preventiveDoneDone = !!record.preventive_done_at
  const effect30Done = !!record.effect_30d_at
  const effect90Done = !!record.effect_90d_at
  const isClosed = record.status === 'closed' || !!record.closed_at
  const isOkResult = (r) => r === '有效' || r === '部分有效'
  const canClose = effect30Done && effect90Done && isOkResult(record.effect_30d_result) && isOkResult(record.effect_90d_result)

  return (
    <Wrapper>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">NCR #{record.id} 详情</h1>
        <div className="flex gap-4 text-sm">
          <button onClick={handleDelete} className="inline-flex items-center gap-1 text-red-600 hover:underline"><Trash2 size={14} />删除 NCR</button>
        </div>
      </div>

      {/* 基本信息 */}
      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">基本信息</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <Info label="发生日期" value={record.occur_date} />
          <Info label="分类" value={record.category} />
          <Info label="严重度">
            <button onClick={updateSeverity} className="text-left" title="点击修改(未完成阶段的 SLA 自动重算)">
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${severityStyle[record.severity] || 'bg-slate-100 text-slate-600'}`}>
                {record.severity || '—'}
              </span>
              <Pencil size={11} className="ml-1 inline text-slate-400" />
            </button>
            {record.severity_auto && record.severity_auto !== record.severity_final && (
              <span className="ml-2 text-xs text-orange-600">(AI 原建议 {record.severity_auto},已被人工修改)</span>
            )}
          </Info>
          <Info label="问题类型" value={record.problem_type} />
          <Info label="部门" value={record.department} />
          <Info label="客户" value={record.customer || '—'} />
          <Info label="输送领域" value={record.transport_mode} />
          <Info label="经济损失" value={record.economic_loss != null ? `¥${Number(record.economic_loss).toLocaleString()}` : '—'} />
          <Info label="状态" value={record.status} />
          <Info label="来源" value={record.source === 'manual' ? '人工手动登录' : record.source} />
        </dl>

        <div className="mt-4">
          <div className="text-xs text-slate-500">事件概要</div>
          <p className="mt-1 text-sm text-slate-800">{record.summary}</p>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-xs font-medium text-slate-500">四角色负责人(点姓名可改)</div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <OwnerCell label="首次遏制" value={record.containment_owner} onEdit={() => updateOwner('containment_owner', record.containment_owner)} />
            <OwnerCell label="原因分析" value={record.root_cause_owner} onEdit={() => updateOwner('root_cause_owner', record.root_cause_owner)} />
            <OwnerCell label="纠正措施" value={record.corrective_owner} onEdit={() => updateOwner('corrective_owner', record.corrective_owner)} />
            <OwnerCell label="预防措施" value={record.preventive_owner} onEdit={() => updateOwner('preventive_owner', record.preventive_owner)} />
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-xs font-medium text-slate-500">六层 SLA 时效</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <SlaBox record={record} kind="containment" />
            <SlaBox record={record} kind="root_cause" />
            <SlaBox record={record} kind="corrective_plan" />
            <SlaBox record={record} kind="corrective_done" />
            <SlaBox record={record} kind="preventive_plan" />
            <SlaBox record={record} kind="preventive_done" />
          </div>
        </div>
      </section>

      {/* 首次遏制 */}
      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <StageHead title="① 首次遏制(止血)" record={record} kind="containment" owner={record.containment_owner} />

        {containmentDone && (
          <div className="mb-4 rounded bg-emerald-50 p-4 text-sm">
            <div className="mb-2 font-medium text-emerald-700">✓ 已完成 · {new Date(record.containment_at).toLocaleString('zh-CN')}</div>
            <div className="whitespace-pre-wrap text-slate-700">{record.containment}</div>
            {record.containment_ai && (
              <details className="mt-3 text-xs text-slate-500">
                <summary className="cursor-pointer">查看 AI 原始建议(对比留痕)</summary>
                <ul className="mt-2 list-disc pl-5">{record.containment_ai.actions?.map((a, i) => <li key={i}>{a}</li>)}</ul>
                {record.containment_ai.spread_risk && <p className="mt-2">扩散风险:{record.containment_ai.spread_risk}</p>}
              </details>
            )}
          </div>
        )}

        {!containmentDone && (
          <>
            {!aiSuggestion && (
              <button onClick={handleGetSuggestion} disabled={suggesting} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {suggesting ? 'AI 思考中…' : '获取 AI 止血建议'}
              </button>
            )}
            {aiSuggestion && (
              <div>
                {aiSuggestion.spread_risk && (
                  <div className="mb-3 rounded border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                    <span className="inline-flex items-center gap-1 font-medium"><AlertTriangle size={14} />扩散风险:</span> {aiSuggestion.spread_risk}
                  </div>
                )}
                <p className="mb-2 text-sm text-slate-600">勾选你已执行的动作;可编辑文字、删除、或新增:</p>
                <ul className="space-y-2">
                  {editableActions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 rounded border border-slate-200 p-2">
                      <input type="checkbox" checked={a.checked} onChange={(e) => updateAction(i, { checked: e.target.checked })} className="mt-2 h-4 w-4 shrink-0" />
                      <input type="text" value={a.text} onChange={(e) => updateAction(i, { text: e.target.value })} className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm" />
                      <button type="button" onClick={() => removeAction(i)} className="px-2 text-slate-400 hover:text-red-600" title="删除这条"><XIcon size={16} /></button>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={addAction} className="mt-2 text-sm text-blue-600 hover:underline">+ 新增一条</button>
                <div className="mt-4 flex items-center gap-3">
                  <button onClick={handleCompleteContainment} disabled={savingContainment} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                    {savingContainment ? '保存中…' : '完成遏制'}
                  </button>
                  <button onClick={handleGetSuggestion} disabled={suggesting} className="text-sm text-blue-600 hover:underline">重新让 AI 建议</button>
                </div>
              </div>
            )}
          </>
        )}
        {containmentError && <div className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{containmentError}</div>}
      </section>

      {/* 原因分析 */}
      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <StageHead title="② 原因分析(5Why)" record={record} kind="root_cause" owner={record.root_cause_owner} />

        {!containmentDone && (
          <div className="rounded bg-slate-50 p-4 text-sm text-slate-500">请先完成首次遏制。</div>
        )}

        {containmentDone && rootCauseDone && editingStage !== 'rootCause' && (
          <div className="rounded bg-emerald-50 p-4 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-emerald-700">✓ 已确认 · {new Date(record.root_cause_at).toLocaleString('zh-CN')}</span>
              <button onClick={() => { setEditingStage('rootCause'); setRootCauseDraft(record.root_cause) }} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><Pencil size={11} />重新编辑</button>
            </div>
            <p className="whitespace-pre-wrap text-slate-700">{record.root_cause}</p>
            {record.capa_ai && (
              <details className="mt-3 text-xs text-slate-500">
                <summary className="cursor-pointer">查看 AI 原始 5Why 草案</summary>
                <ol className="mt-2 list-decimal pl-5">{record.capa_ai.five_why_chain?.map((w, i) => <li key={i}>{w}</li>)}</ol>
                <p className="mt-2">AI 根因:{record.capa_ai.root_cause}</p>
              </details>
            )}
          </div>
        )}

        {containmentDone && (!rootCauseDone || editingStage === 'rootCause') && (
          <>
            {!rootCauseDraft && (
              <button onClick={getRootCauseAi} disabled={capaSuggesting} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {capaSuggesting ? 'AI 思考中…' : '获取 AI 原因分析建议'}
              </button>
            )}
            {rootCauseDraft && (
              <div>
                <textarea value={rootCauseDraft} onChange={(e) => setRootCauseDraft(e.target.value)} rows={8}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="编辑根本原因(含 5Why 推理过程)" />
                <div className="mt-3 flex items-center gap-3">
                  <button onClick={submitRootCause} disabled={savingStage === 'root'} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                    {savingStage === 'root' ? '保存中…' : (editingStage === 'rootCause' ? '保存修改' : '提交原因分析(签字)')}
                  </button>
                  {editingStage === 'rootCause' && (
                    <button onClick={() => setEditingStage(null)} className="text-sm text-slate-500 hover:underline">取消</button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* 纠正措施 */}
      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-semibold">③④ 纠正措施(治已病)</h3>
          <span className="text-xs text-slate-500">负责人:{record.corrective_owner || '(未指定)'}</span>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <StageSubStatus record={record} kind="corrective_plan" />
          <StageSubStatus record={record} kind="corrective_done" />
        </div>

        {!rootCauseDone && (
          <div className="rounded bg-slate-50 p-4 text-sm text-slate-500">请先完成原因分析。</div>
        )}

        {rootCauseDone && (!correctivePlanDone || editingStage === 'corrPlan') && (
          <>
            {!correctiveDraft && (
              <button onClick={getCorrectiveAi} disabled={capaSuggesting} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {capaSuggesting ? 'AI 思考中…' : '获取 AI 纠正措施建议'}
              </button>
            )}
            {correctiveDraft && (
              <div>
                <p className="mb-2 text-sm text-slate-600">编辑纠正措施方案:</p>
                <textarea value={correctiveDraft} onChange={(e) => setCorrectiveDraft(e.target.value)} rows={4}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                <div className="mt-3 flex items-center gap-3">
                  <button onClick={submitCorrectivePlan} disabled={savingStage === 'corrPlan'} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                    {savingStage === 'corrPlan' ? '保存中…' : (editingStage === 'corrPlan' ? '保存修改' : '③ 提交纠正方案')}
                  </button>
                  {editingStage === 'corrPlan' && (
                    <button onClick={() => setEditingStage(null)} className="text-sm text-slate-500 hover:underline">取消</button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {correctivePlanDone && editingStage !== 'corrPlan' && (
          <div className="rounded bg-blue-50 p-4 text-sm">
            <div className="mb-2 flex justify-end">
              <button onClick={() => { setEditingStage('corrPlan'); setCorrectiveDraft(record.corrective_action) }} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><Pencil size={11} />重新编辑方案</button>
            </div>
            <p className="whitespace-pre-wrap text-slate-700">{record.corrective_action}</p>
            {record.capa_ai?.corrective_action && (
              <details className="mt-3 text-xs text-slate-500">
                <summary className="cursor-pointer">查看 AI 原始建议(对比留痕)</summary>
                <p className="mt-2 whitespace-pre-wrap">{record.capa_ai.corrective_action}</p>
              </details>
            )}
            {!correctiveDoneDone && (
              <button onClick={markCorrectiveDone} disabled={savingStage === 'corrDone'} className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {savingStage === 'corrDone' ? '保存中…' : '④ 标记纠正措施已完成'}
              </button>
            )}
          </div>
        )}
      </section>

      {/* 预防措施 */}
      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-semibold">⑤⑥ 预防措施(治未病)</h3>
          <span className="text-xs text-slate-500">负责人:{record.preventive_owner || '(未指定)'}</span>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <StageSubStatus record={record} kind="preventive_plan" />
          <StageSubStatus record={record} kind="preventive_done" />
        </div>

        {!rootCauseDone && (
          <div className="rounded bg-slate-50 p-4 text-sm text-slate-500">请先完成原因分析。</div>
        )}

        {rootCauseDone && (!preventivePlanDone || editingStage === 'prevPlan') && (
          <>
            {!preventiveDraft && (
              <button onClick={getPreventiveAi} disabled={capaSuggesting} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {capaSuggesting ? 'AI 思考中…' : '获取 AI 预防措施建议'}
              </button>
            )}
            {preventiveDraft && (
              <div>
                <p className="mb-2 text-sm text-slate-600">编辑预防措施方案:</p>
                <textarea value={preventiveDraft} onChange={(e) => setPreventiveDraft(e.target.value)} rows={4}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                <div className="mt-3 flex items-center gap-3">
                  <button onClick={submitPreventivePlan} disabled={savingStage === 'prevPlan'} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                    {savingStage === 'prevPlan' ? '保存中…' : (editingStage === 'prevPlan' ? '保存修改' : '⑤ 提交预防方案')}
                  </button>
                  {editingStage === 'prevPlan' && (
                    <button onClick={() => setEditingStage(null)} className="text-sm text-slate-500 hover:underline">取消</button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {preventivePlanDone && editingStage !== 'prevPlan' && (
          <div className="rounded bg-blue-50 p-4 text-sm">
            <div className="mb-2 flex justify-end">
              <button onClick={() => { setEditingStage('prevPlan'); setPreventiveDraft(record.preventive_action) }} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><Pencil size={11} />重新编辑方案</button>
            </div>
            <p className="whitespace-pre-wrap text-slate-700">{record.preventive_action}</p>
            {record.capa_ai?.preventive_action && (
              <details className="mt-3 text-xs text-slate-500">
                <summary className="cursor-pointer">查看 AI 原始建议(对比留痕)</summary>
                <p className="mt-2 whitespace-pre-wrap">{record.capa_ai.preventive_action}</p>
              </details>
            )}
            {!preventiveDoneDone && (
              <button onClick={markPreventiveDone} disabled={savingStage === 'prevDone'} className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {savingStage === 'prevDone' ? '保存中…' : '⑥ 标记预防措施已完成'}
              </button>
            )}

            {/* 不符合项报告生成(预防措施制定完成即可出) */}
            <div className="mt-4 rounded-md border border-emerald-200 bg-white p-3">
              <div className="mb-2 text-xs font-medium text-emerald-700">📄 生成不符合项报告</div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/ncr/${id}/report/internal`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <FileText size={14} /> 社内审计版(完整)
                </Link>
                <Link
                  href={`/ncr/${id}/report/external`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Send size={14} /> 社外版(提交客户)
                </Link>
              </div>
              <p className="mt-2 text-xs text-slate-500">在新页打开,顶部可一键打印/导出 PDF</p>
            </div>
          </div>
        )}
      </section>

      {stageError && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{stageError}</div>}

      {/* 效果验证 + 结案 */}
      {preventiveDoneDone && (
        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-lg font-semibold">⑦⑧ 效果验证 + 结案</h3>
          <p className="mb-4 text-xs text-slate-500">
            预防措施落地后,在 30 天 / 90 天分别回看效果。两次都为「有效」或「部分有效」即可结案。
          </p>

          {isClosed ? (
            <div className="rounded bg-emerald-50 p-4 text-sm">
              <div className="mb-2 font-medium text-emerald-700">
                ✓ 已结案 · {record.closed_at ? new Date(record.closed_at).toLocaleString('zh-CN') : '—'}
              </div>
              <div>根本原因类别(用于品质统计):<span className="ml-1 font-medium">{record.root_cause_category || '—'}</span></div>
              <details className="mt-3 text-xs text-slate-500">
                <summary className="cursor-pointer">查看两次验证记录</summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="font-medium">⑦ 30 天验证:</span> {record.effect_30d_result || '—'}
                    {record.effect_30d_at && <span className="ml-2 text-slate-400">({new Date(record.effect_30d_at).toLocaleString('zh-CN')})</span>}
                    {record.effect_30d_note && <div className="mt-1 text-slate-700">备注:{record.effect_30d_note}</div>}
                  </div>
                  <div>
                    <span className="font-medium">⑧ 90 天验证:</span> {record.effect_90d_result || '—'}
                    {record.effect_90d_at && <span className="ml-2 text-slate-400">({new Date(record.effect_90d_at).toLocaleString('zh-CN')})</span>}
                    {record.effect_90d_note && <div className="mt-1 text-slate-700">备注:{record.effect_90d_note}</div>}
                  </div>
                </div>
              </details>
            </div>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <EffectCard
                  label="⑦ 30 天验证"
                  done={effect30Done}
                  result={record.effect_30d_result}
                  at={record.effect_30d_at}
                  note={record.effect_30d_note}
                  draft={effect30Draft}
                  setDraft={setEffect30Draft}
                  onSubmit={submitEffect30}
                  saving={savingStage === 'effect30'}
                />
                <EffectCard
                  label="⑧ 90 天验证"
                  done={effect90Done}
                  result={record.effect_90d_result}
                  at={record.effect_90d_at}
                  note={record.effect_90d_note}
                  draft={effect90Draft}
                  setDraft={setEffect90Draft}
                  onSubmit={submitEffect90}
                  saving={savingStage === 'effect90'}
                />
              </div>

              {canClose && (
                <div className="rounded border border-blue-200 bg-blue-50 p-4">
                  <div className="mb-2 text-sm font-medium text-blue-700">两次验证均通过,可结案 ✓</div>
                  <div className="space-y-2">
                    <label className="block text-xs text-slate-600">根本原因类别(用于品质统计,必填)</label>
                    <select
                      value={closingCategory}
                      onChange={(e) => setClosingCategory(e.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">请选择</option>
                      {PROBLEM_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button
                      onClick={handleCloseNCR}
                      disabled={savingStage === 'closing'}
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {savingStage === 'closing' ? '结案中…' : '✓ 结案'}
                    </button>
                  </div>
                </div>
              )}
              {effect30Done && effect90Done && !canClose && (
                <div className="flex items-start gap-2 rounded bg-orange-50 p-3 text-sm text-orange-700">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>两次验证有「无效」或「需追加 CAPA」,不能直接结案。建议开新 NCR 或追加 CAPA 措施后再来验证。</span>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </Wrapper>
  )
}

function Wrapper({ children }) {
  return <main className="min-h-screen bg-slate-50 p-8 text-slate-800"><div className="mx-auto max-w-4xl">{children}</div></main>
}

function Info({ label, value, children }) {
  return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-0.5 text-sm">{children ?? value ?? '—'}</dd></div>
}

function OwnerCell({ label, value, onEdit }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <button onClick={onEdit} className="mt-0.5 text-sm text-slate-800 hover:text-blue-600" title="点击修改">
        {value || '(未指定)'} <Pencil size={11} className="inline text-slate-400" />
      </button>
    </div>
  )
}

function SlaBox({ record, kind }) {
  const status = getStageStatus(record, kind)
  const label = SLA_LABELS[kind]
  const isDone = status.state === 'done'
  return (
    <div className={`rounded border p-2 text-xs ${
      isDone ? 'border-emerald-200 bg-emerald-50' :
      status.color === 'text-red-600' ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
    }`}>
      <div className="font-medium text-slate-700">{label}</div>
      <div className="mt-0.5 text-slate-500">截止 {status.dueText}</div>
      <div className={`mt-0.5 font-medium ${status.color}`}>
        {status.badge}{status.doneText && ` · ${status.doneText}`}
      </div>
    </div>
  )
}

function StageHead({ title, record, kind, owner }) {
  const status = getStageStatus(record, kind)
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-slate-500">负责人:<span className="text-slate-800">{owner || '(未指定)'}</span></span>
        <span className="text-slate-500">截止:{status.dueText}</span>
        <span className={`font-medium ${status.color}`}>{status.badge}{status.doneText && ` · ${status.doneText}`}</span>
      </div>
    </div>
  )
}

function EffectCard({ label, done, result, at, note, draft, setDraft, onSubmit, saving }) {
  return (
    <div className="rounded border border-slate-200 p-3">
      <div className="mb-2 text-sm font-medium">{label}</div>
      {done ? (
        <div className="text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">结果:</span>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${RESULT_STYLE[result] || 'bg-slate-100 text-slate-600'}`}>
              {result || '—'}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">于 {new Date(at).toLocaleString('zh-CN')}</div>
          {note && <div className="mt-1 text-xs text-slate-700">备注:{note}</div>}
        </div>
      ) : (
        <div className="space-y-2">
          <select
            value={draft.result}
            onChange={(e) => setDraft({ ...draft, result: e.target.value })}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">选择验证结果</option>
            {EFFECT_RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <textarea
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            placeholder="备注(可选)"
            rows={2}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button
            onClick={onSubmit}
            disabled={saving}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? '保存中…' : '提交'}
          </button>
        </div>
      )}
    </div>
  )
}

function StageSubStatus({ record, kind }) {
  const status = getStageStatus(record, kind)
  const label = SLA_LABELS[kind]
  const isDone = status.state === 'done'
  return (
    <div className={`rounded border p-2 text-xs ${
      isDone ? 'border-emerald-200 bg-emerald-50' :
      status.color === 'text-red-600' ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
    }`}>
      <div className="font-medium text-slate-700">{label}</div>
      <div className="mt-0.5 text-slate-500">截止 {status.dueText}</div>
      <div className={`mt-0.5 font-medium ${status.color}`}>{status.badge}{status.doneText && ` · ${status.doneText}`}</div>
    </div>
  )
}
