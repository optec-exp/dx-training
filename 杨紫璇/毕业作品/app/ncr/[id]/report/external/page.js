'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/lib/ui'
import { fmtDateOnly, reportNo, extractRootCauseConclusion } from '@/lib/report'

// 社外版默认不暴露:负责人姓名、SLA 时效、经济损失、严重度内部分级、部门细分、AI 留痕

export default function ExternalReportPage() {
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

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-800 print:bg-white print:p-0">
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

      <article className="report-paper mx-auto max-w-4xl bg-white p-12 shadow-sm print:max-w-none print:p-12 print:shadow-none">
        {/* 报头 */}
        <header className="mb-8 border-b-2 border-slate-900 pb-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500">OPTEC EXPRESS · Quality Management</div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">不符合项处理报告</h1>
              <div className="mt-1 text-xs text-slate-500">Non-Conformance Report</div>
            </div>
            <div className="text-right text-xs text-slate-600">
              <div>报告编号:<span className="font-mono">{reportNo(record)}</span></div>
              <div>出具日期:{fmtDateOnly(new Date())}</div>
            </div>
          </div>
        </header>

        {/* 致 */}
        <div className="mb-6 text-sm leading-7">
          <p>致 <span className="font-medium">{record.customer || '尊敬的客户'}</span>:</p>
          <p className="mt-2 text-slate-700 indent-8">
            就贵司相关业务中出现的不符合项,我司经过完整的内部调查与整改流程,现将处理结果正式呈报如下,
            敬请审阅。
          </p>
        </div>

        {/* 事件信息 */}
        <Section title="一、事件信息">
          <Grid>
            <Cell label="发生日期" value={fmtDateOnly(record.occur_at || record.occur_date)} />
            <Cell label="问题类型" value={record.problem_type} />
          </Grid>
          <Field label="事件描述" mt>
            <p className="whitespace-pre-wrap leading-7">{record.summary || '—'}</p>
          </Field>
        </Section>

        {/* 原因分析(只给结论 — 屏蔽 5Why 推演链) */}
        <Section title="二、原因分析结论">
          <Field>
            <p className="whitespace-pre-wrap leading-7">
              {extractRootCauseConclusion(record.root_cause) || '正在分析中,完成后另行告知。'}
            </p>
          </Field>
        </Section>

        {/* 已采取的纠正措施(不写负责人/时效/完成日期) */}
        <Section title="三、已采取的纠正措施">
          <Field>
            <p className="whitespace-pre-wrap leading-7">{record.corrective_action || '—'}</p>
          </Field>
        </Section>

        {/* 预防措施承诺 */}
        <Section title="四、后续预防措施承诺">
          <Field>
            <p className="whitespace-pre-wrap leading-7">{record.preventive_action || '—'}</p>
          </Field>
        </Section>

        {/* 效果验证(若已结案才显示,且只显示结论) */}
        {record.status === 'closed' && (record.effect_30d_result || record.effect_90d_result) && (
          <Section title="五、措施效果">
            <p className="leading-7">
              本公司已对上述纠正及预防措施实施效果进行复核,
              {record.effect_30d_result && `30 天复核结果为「${record.effect_30d_result}」`}
              {record.effect_30d_result && record.effect_90d_result && '、'}
              {record.effect_90d_result && `90 天复核结果为「${record.effect_90d_result}」`}
              。
            </p>
          </Section>
        )}

        {/* 致歉与承诺 */}
        <div className="mt-8 rounded border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
          <p>此次不符合事项给贵司业务造成的不便,我司深表歉意。</p>
          <p className="mt-1">我司将持续优化品质管理体系,严格执行上述纠正与预防措施,杜绝同类情况再次发生。
          后续如需进一步沟通或现场审核,我司全力配合。</p>
        </div>

        {/* 落款 */}
        <footer className="mt-12 text-sm">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-slate-700">出具单位:OPTEC EXPRESS</div>
              <div className="mt-1 text-slate-700">联系部门:品质管理部</div>
            </div>
            <div className="text-right">
              <div className="mb-12 text-slate-700">公司签章:</div>
              <div className="text-slate-700">出具日期:{fmtDateOnly(new Date())}</div>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-200 pt-3 text-center text-xs text-slate-400">
            报告编号 {reportNo(record)} · 本报告由 OPTEC QMS 系统生成
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
  return <div className="grid grid-cols-2 gap-x-6 gap-y-2">{children}</div>
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
      {label && <div className="text-xs text-slate-500">{label}</div>}
      <div className={`${label ? 'mt-1' : ''} rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800`}>{children}</div>
    </div>
  )
}
