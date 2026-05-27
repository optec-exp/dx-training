'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  supabase,
  CATEGORY_LABELS,
  ExpenseApplication,
  ExpenseStatusHistory,
} from '@/lib/supabase';
import { StatusBadge } from '@/components/StatusBadge';
import { ActionPanel } from '@/components/ActionPanel';
import { isImageUrl, getFileNameFromUrl } from '@/lib/storage';

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [app, setApp] = useState<ExpenseApplication | null>(null);
  const [history, setHistory] = useState<ExpenseStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const { data: appData, error: appErr } = await supabase
      .from('expense_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (appErr) {
      setError(appErr.message);
      setLoading(false);
      return;
    }
    setApp(appData as ExpenseApplication);

    const { data: hisData, error: hisErr } = await supabase
      .from('expense_status_history')
      .select('*')
      .eq('application_id', id)
      .order('created_at', { ascending: true });

    if (hisErr) {
      setError(hisErr.message);
    } else {
      setHistory((hisData ?? []) as ExpenseStatusHistory[]);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (s: string | null) => (s ? new Date(s).toLocaleString('zh-CN', { hour12: false }) : '—');

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="mb-4">
        <Link href="/applications" className="text-blue-600 hover:underline text-sm">← 返回列表</Link>
      </div>

      {loading && <p className="text-gray-500">加载中…</p>}

      {error && (
        <div className="bg-red-50 border border-red-300 rounded p-3 text-red-800 text-sm">
          加载失败：{error}
        </div>
      )}

      {!loading && !error && !app && (
        <div className="border border-dashed border-gray-300 rounded p-8 text-center text-gray-500">
          申请单不存在
        </div>
      )}

      {app && (
        <>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">申请详情</h1>
            <StatusBadge status={app.status} />
          </div>
          <p className="text-xs text-gray-500 font-mono mb-6">ID: {app.id}</p>

          <ActionPanel application={app} onSuccess={load} />

          <section className="border border-gray-200 rounded p-5 space-y-3 mb-8">
            <Row label="申请人">{app.applicant_name}</Row>
            <Row label="类别">{CATEGORY_LABELS[app.category] ?? app.category}</Row>
            <Row label="金额">
              <span className="font-mono">¥ {Number(app.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </Row>
            <Row label="摘要">
              <span className="whitespace-pre-wrap">{app.summary}</span>
            </Row>
            <Row label="凭证">
              {app.receipt_url ? (
                isImageUrl(app.receipt_url) ? (
                  <div className="flex flex-col gap-2">
                    <a href={app.receipt_url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={app.receipt_url}
                        alt="凭证"
                        className="max-w-xs max-h-48 border border-gray-300 rounded hover:opacity-90 cursor-zoom-in"
                      />
                    </a>
                    <a
                      href={app.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      🔗 在新标签打开原图
                    </a>
                  </div>
                ) : (
                  <a
                    href={app.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    📎 {getFileNameFromUrl(app.receipt_url)}
                  </a>
                )
              ) : (
                <span className="text-gray-400">未上传</span>
              )}
            </Row>
            <Row label="创建时间">{fmt(app.created_at)}</Row>
            <Row label="申请提交时间">{fmt(app.applied_at)}</Row>
            <Row label="审批完成时间">{fmt(app.approved_at)}</Row>
            <Row label="最后更新">{fmt(app.updated_at)}</Row>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3">状态变更历史</h2>
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm">暂无历史记录</p>
            ) : (
              <ol className="relative border-l-2 border-gray-200 ml-2 space-y-5">
                {history.map((h) => (
                  <li key={h.id} className="ml-6">
                    <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
                    <div className="text-xs text-gray-500 mb-1">{fmt(h.created_at)}</div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {h.from_status ? (
                        <>
                          <StatusBadge status={h.from_status} />
                          <span className="text-gray-400">→</span>
                          <StatusBadge status={h.to_status} />
                        </>
                      ) : (
                        <>
                          <span className="text-gray-500 text-sm">（首次创建）</span>
                          <span className="text-gray-400">→</span>
                          <StatusBadge status={h.to_status} />
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">
                      操作人：<span className="font-semibold">{h.operator_name}</span>
                    </div>
                    {h.comment && (
                      <div className="text-sm text-gray-600 mt-1 bg-gray-50 border border-gray-200 rounded p-2">
                        {h.comment}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-sm">
      <dt className="text-gray-500 font-semibold">{label}</dt>
      <dd className="text-gray-900">{children}</dd>
    </div>
  );
}
