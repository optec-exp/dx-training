'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/lib/ui'
import {
  fmtDate, fmtDateOnly, fmtMoney, slaCompliance,
  extractContainmentActions, extractFiveWhy, reportNo,
} from '@/lib/report'

export default function InternalReportPage() {
  const { id } = useParams()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('ncr_records').select('*').eq('id', id).single()
      if (error) setError(error.message)
      else setRecord(data)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <Wrapper><div className="flex items-center gap-2 text-sm text-slate-500"><Spinner /> 加载中…</div></Wrapper>
  if (error) return <Wrapper><div className="rounded bg-red-50 p-4 text-red-700">读取出错:{error}</div></Wrapper>
  if (!record) return <Wrapper><p>找不到这条 NCR</p></Wrapper>

  const containmentActions = extractContainmentActions(record)
  const fiveWhy = extractFiveWhy(record)

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-800 print:bg-white print:p-0">
      {/* 工具栏:仅屏幕显示,打印时隐藏 */}
      <div className="mx-auto mb-4 flex max-w-4xl items-center justify-between print:hidden">
        <Link href={`/ncr/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={14} /> 返回 NCR 详情
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <Printer size={16} /> 打印 / 导出 PDF
        </button>
      </div>

      {/* A4-ish 报告纸 */}
      <article className="report-paper mx-auto max-w-4xl bg-white p-12 shadow-sm print:max-w-none print:p-10 print:shadow-none">
        {/* 报头 */}
        <header className="mb-6 border-b-2 border-slate-900 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500">OPTEC EXPRESS · 品质管理体系</div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">不符合项报告(内部审计版)</h1>
            </div>
            <div className="text-right text-xs text-slate-600">
              <div>报告编号:<span className="font-mono">{reportNo(record)}</span></div>
              <div>出具日期:{fmtDateOnly(new Date())}</div>
              <div>密级:<span className="font-medium text-red-700">内部限阅</span></div>
            </div>
          </div>
        </header>

        {/* 基本信息 */}
        <Section title="一、基本信息">
          <Grid>
            <Cell label="发生日期" value={fmtDate(record.occur_at || record.occur_date)} />
            <Cell label="分类" value={record.category} />
            <Cell label="输送领域" value={record.transport_mode} />
            <Cell label="部门" value={record.department} />
            <Cell label="客户" value={record.customer || '—'} />
            <Cell label="问题类型" value={record.problem_type} />
            <Cell label="严重度" value={
              <span>
                {record.severity_final || record.severity || '—'}
                {record.severity_auto && record.severity_auto !== (record.severity_final || record.severity) && (
                  <span className="ml-2 text-xs text-orange-700">(AI 原建议 {record.severity_auto},人工修改为 {record.severity_final || record.severity})</span>
                )}
              </span>
            } />
            <Cell label="经济损失" value={fmtMoney(record.economic_loss)} />
            <Cell label="录入来源" value={record.source === 'manual' ? '人工录入' : (record.source || '—')} />
            <Cell label="当前状态" value={record.status === 'closed' ? '已结案' : '未结案'} />
          </Grid>
          <Field label="事件概要" mt>
            <p className="whitespace-pre-wrap">{record.summary || '—'}</p>
          </Field>
        </Section>

        {/* ① 首次遏制 */}
        <Section title="二、首次遏制(止血)">
          <Grid>
            <Cell label="负责人" value={record.containment_owner} />
            <Cell label="完成时间" value={fmtDate(record.containment_at)} />
          </Grid>
          <Field label="遏制内容" mt><p className="whitespace-pre-wrap">{record.containment || '—'}</p></Field>
          {containmentActions.length > 0 && (
            <Field label="AI 推荐动作(留痕)" mt>
              <ul className="list-disc pl-5 text-sm text-slate-700">
                {containmentActions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
              {record.containment_ai?.spread_risk && (
                <p className="mt-2 text-sm text-slate-600">扩散风险评估:{record.containment_ai.spread_risk}</p>
              )}
            </Field>
          )}
        </Section>

        {/* ② 根本原因分析 */}
        <Section title="三、根本原因分析(5Why)">
          <Grid>
            <Cell label="负责人" value={record.root_cause_owner} />
            <Cell label="完成时间" value={fmtDate(record.root_cause_at)} />
            <Cell label="根本原因类别" value={record.root_cause_category} />
          </Grid>
          {fiveWhy.length > 0 && (
            <Field label="5Why 推演链(AI 留痕)" mt>
              <ol className="list-decimal pl-5 text-sm text-slate-700">
                {fiveWhy.map((w, i) => <li key={i} className="mb-0.5">{w}</li>)}
              </ol>
            </Field>
          )}
          <Field label="根本原因结论" mt><p className="whitespace-pre-wrap">{record.root_cause || '—'}</p></Field>
        </Section>

        {/* ③ 纠正措施 */}
        <Section title="四、纠正措施(Corrective Action)">
          <Grid>
            <Cell label="负责人" value={record.corrective_owner} />
            <Cell label="制定时间" value={fmtDate(record.corrective_plan_at)} />
            <Cell label="完成时间" value={fmtDate(record.corrective_done_at)} />
          </Grid>
          <Field label="措施内容" mt><p className="whitespace-pre-wrap">{record.corrective_action || '—'}</p></Field>
        </Section>

        {/* ④ 预防措施 */}
        <Section title="五、预防措施(Preventive Action)">
          <Grid>
            <Cell label="负责人" value={record.preventive_owner} />
            <Cell label="制定时间" value={fmtDate(record.preventive_plan_at)} />
            <Cell label="完成时间" value={fmtDate(record.preventive_done_at)} />
          </Grid>
          <Field label="措施内容" mt><p className="whitespace-pre-wrap">{record.preventive_action || '—'}</p></Field>
        </Section>

        {/* ⑤ SLA 时效合规 */}
        <Section title="六、SLA 时效合规(基于发生时间计算)">
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-50 text-left text-xs uppercase text-slate-600">
                <th className="py-2 pl-2 pr-3">阶段</th>
                <th className="px-3 py-2">SLA 截止</th>
                <th className="px-3 py-2">实际完成</th>
                <th className="px-3 py-2">合规情况</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['首次遏制', 'sla_containment_due', 'containment_at'],
                ['原因分析', 'sla_root_cause_due', 'root_cause_at'],
                ['纠正措施·制定', 'sla_corrective_plan_due', 'corrective_plan_at'],
                ['纠正措施·完成', 'sla_corrective_done_due', 'corrective_done_at'],
                ['预防措施·制定', 'sla_preventive_plan_due', 'preventive_plan_at'],
                ['预防措施·完成', 'sla_preventive_done_due', 'preventive_done_at'],
              ].map(([label, dueK, doneK]) => {
                const c = slaCompliance(record[dueK], record[doneK])
                return (
                  <tr key={label} className="border-b border-slate-200">
                    <td className="py-2 pl-2 pr-3 font-medium">{label}</td>
                    <td className="px-3 py-2 text-slate-700">{fmtDate(record[dueK])}</td>
                    <td className="px-3 py-2 text-slate-700">{fmtDate(record[doneK])}</td>
                    <td className={`px-3 py-2 ${c.overdue ? 'text-red-700 font-medium' : 'text-emerald-700'}`}>{c.text}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Section>

        {/* ⑥ 效果验证 */}
        <Section title="七、效果验证">
          <Grid>
            <Cell label="30 天验证结果" value={record.effect_30d_result} />
            <Cell label="30 天验证时间" value={fmtDate(record.effect_30d_at)} />
            <Cell label="90 天验证结果" value={record.effect_90d_result} />
            <Cell label="90 天验证时间" value={fmtDate(record.effect_90d_at)} />
          </Grid>
          {(record.effect_30d_note || record.effect_90d_note) && (
            <Field label="验证备注" mt>
              {record.effect_30d_note && <p className="text-sm"><span className="text-slate-500">30天:</span>{record.effect_30d_note}</p>}
              {record.effect_90d_note && <p className="mt-1 text-sm"><span className="text-slate-500">90天:</span>{record.effect_90d_note}</p>}
            </Field>
          )}
        </Section>

        {/* 结案 */}
        {record.status === 'closed' && (
          <Section title="八、结案">
            <Grid>
              <Cell label="结案时间" value={fmtDate(record.closed_at)} />
              <Cell label="根本原因类别" value={record.root_cause_category} />
            </Grid>
          </Section>
        )}

        {/* 报告签章 */}
        <footer className="mt-10 border-t border-slate-300 pt-6 text-sm">
          <div className="grid grid-cols-3 gap-8">
            <SignBlock title="编制人" />
            <SignBlock title="审核人" />
            <SignBlock title="批准人" />
          </div>
          <div className="mt-8 text-center text-xs text-slate-400">
            本报告由 OPTEC QMS 系统自动生成 · 报告编号 {reportNo(record)} · {fmtDateOnly(new Date())}
          </div>
        </footer>
      </article>
    </main>
  )
}

function Wrapper({ children }) {
  return <main className="min-h-screen bg-slate-100 p-6"><div className="mx-auto max-w-4xl">{children}</div></main>
}

function Section({ title, children }) {
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="mb-3 border-l-4 border-emerald-600 pl-3 text-base font-semibold text-slate-900">{title}</h2>
      <div className="text-sm text-slate-800">{children}</div>
    </section>
  )
}

function Grid({ children }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">{children}</div>
}

function Cell({ label, value }) {
  return (
    <div className="text-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-0.5 text-slate-800">{value || '—'}</div>
    </div>
  )
}

function Field({ label, children, mt }) {
  return (
    <div className={mt ? 'mt-3' : ''}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">{children}</div>
    </div>
  )
}

function SignBlock({ title }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-1 h-12 border-b border-slate-400" />
      <div className="mt-1 text-xs text-slate-400">签名 / 日期</div>
    </div>
  )
}
