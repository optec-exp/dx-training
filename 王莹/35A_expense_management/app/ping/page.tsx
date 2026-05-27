'use client';

import { useEffect, useState } from 'react';
import { supabase, RECEIPT_BUCKET } from '@/lib/supabase';

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
};

export default function PingPage() {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const checks: CheckResult[] = [];

      // 1. 表 expense_applications 是否存在 + 可查
      try {
        const { error } = await supabase
          .from('expense_applications')
          .select('id', { count: 'exact', head: true });
        checks.push({
          name: '表 expense_applications',
          ok: !error,
          detail: error ? error.message : '存在且可查',
        });
      } catch (e) {
        checks.push({ name: '表 expense_applications', ok: false, detail: String(e) });
      }

      // 2. 表 expense_status_history 是否存在
      try {
        const { error } = await supabase
          .from('expense_status_history')
          .select('id', { count: 'exact', head: true });
        checks.push({
          name: '表 expense_status_history',
          ok: !error,
          detail: error ? error.message : '存在且可查',
        });
      } catch (e) {
        checks.push({ name: '表 expense_status_history', ok: false, detail: String(e) });
      }

      // 3. 视图 expense_monthly_summary
      try {
        const { error } = await supabase
          .from('expense_monthly_summary')
          .select('*', { count: 'exact', head: true });
        checks.push({
          name: '视图 expense_monthly_summary',
          ok: !error,
          detail: error ? error.message : '存在且可查',
        });
      } catch (e) {
        checks.push({ name: '视图 expense_monthly_summary', ok: false, detail: String(e) });
      }

      // 4. RPC expense_create_draft（试调一个无效参数应返回结构化错误，证明函数存在）
      try {
        const { error } = await supabase.rpc('expense_create_draft', {
          p_applicant_name: '__ping_test__',
          p_category: 'invalid_category',  // 故意写错类别，应触发 CHECK 失败
          p_amount: 1,
          p_summary: '__ping_test__',
        });
        const fnExists = !!error && error.message.toLowerCase().includes('check');
        checks.push({
          name: 'RPC expense_create_draft',
          ok: fnExists,
          detail: fnExists ? '存在（CHECK 拦截成功）' : (error?.message ?? '未预期成功'),
        });
      } catch (e) {
        checks.push({ name: 'RPC expense_create_draft', ok: false, detail: String(e) });
      }

      // 5. RPC expense_change_status（用不存在的 uuid 调用，应抛"申请单不存在"，证明函数存在）
      try {
        const { error } = await supabase.rpc('expense_change_status', {
          p_application_id: '00000000-0000-0000-0000-000000000000',
          p_new_status: 'submitted',
          p_operator_name: '__ping_test__',
          p_comment: null,
        });
        const fnExists = !!error && (
          error.message.includes('申请单不存在') || error.message.includes('does not exist')
        );
        checks.push({
          name: 'RPC expense_change_status',
          ok: fnExists,
          detail: fnExists ? '存在（异常拦截成功）' : (error?.message ?? '未预期成功'),
        });
      } catch (e) {
        checks.push({ name: 'RPC expense_change_status', ok: false, detail: String(e) });
      }

      // 6. Storage bucket expense-receipts
      try {
        const { data, error } = await supabase.storage.from(RECEIPT_BUCKET).list('', { limit: 1 });
        checks.push({
          name: `Storage bucket ${RECEIPT_BUCKET}`,
          ok: !error,
          detail: error ? error.message : `存在（当前 ${data?.length ?? 0} 个文件）`,
        });
      } catch (e) {
        checks.push({ name: `Storage bucket ${RECEIPT_BUCKET}`, ok: false, detail: String(e) });
      }

      setResults(checks);
      setLoading(false);
    };
    run();
  }, []);

  const allOk = results.length > 0 && results.every((r) => r.ok);

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">作品 40A - Supabase 连接诊断</h1>
      <p className="text-sm text-gray-600 mb-6">
        URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}
      </p>

      {loading && <p>检查中…</p>}

      {!loading && (
        <>
          <div
            className={`mb-4 p-3 rounded font-semibold ${
              allOk ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {allOk ? '全部通过 ✓ — 可以进入 Step 3' : '存在失败项 — 请检查 schema.sql 是否已执行 / bucket 是否已创建'}
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">检查项</th>
                <th className="border p-2 text-left w-20">结果</th>
                <th className="border p-2 text-left">详情</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.name}>
                  <td className="border p-2">{r.name}</td>
                  <td className="border p-2">
                    {r.ok ? (
                      <span className="text-green-700 font-bold">OK</span>
                    ) : (
                      <span className="text-red-700 font-bold">FAIL</span>
                    )}
                  </td>
                  <td className="border p-2 text-sm break-all">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
