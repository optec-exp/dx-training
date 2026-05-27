'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, CATEGORY_LABELS, ExpenseApplication } from '@/lib/supabase';
import { StatusBadge } from '@/components/StatusBadge';
import { ReceiptUploader } from '@/components/ReceiptUploader';
import { uploadReceipt, deleteReceiptByUrl } from '@/lib/storage';

type FormErrors = {
  applicant_name?: string;
  category?: string;
  amount?: string;
  summary?: string;
};

export default function EditApplicationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [app, setApp] = useState<ExpenseApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [applicantName, setApplicantName] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [summary, setSummary] = useState('');
  // 凭证三种意图：
  //   existingUrl !== null && newFile === null && !removeExisting   → 保留原凭证
  //   newFile !== null                                              → 替换（删旧+上传新）
  //   removeExisting === true && newFile === null                   → 删除
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
  const [newReceiptFile, setNewReceiptFile] = useState<File | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('expense_applications')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        setLoadError(error.message);
        setLoading(false);
        return;
      }
      const a = data as ExpenseApplication;
      setApp(a);
      setApplicantName(a.applicant_name);
      setCategory(a.category);
      setAmount(String(a.amount));
      setSummary(a.summary);
      setExistingReceiptUrl(a.receipt_url);
      setLoading(false);
    };
    load();
  }, [id]);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!applicantName.trim()) e.applicant_name = '请填写申请人姓名';
    if (!category) e.category = '请选择类别';
    const n = Number(amount);
    if (!amount.trim()) {
      e.amount = '请填写金额';
    } else if (isNaN(n) || n <= 0) {
      e.amount = '金额必须为大于 0 的数字';
    }
    if (!summary.trim()) e.summary = '请填写摘要';
    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setSaveError(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (receiptError) return;

    setSaving(true);
    try {
      // 决定 receipt_url 的最终值
      let finalReceiptUrl: string | null | undefined = undefined;  // undefined = 不修改
      const originalUrl = app?.receipt_url ?? null;

      if (newReceiptFile) {
        // 替换：先上传新的
        const { publicUrl } = await uploadReceipt(newReceiptFile);
        finalReceiptUrl = publicUrl;
      } else if (removeExisting && originalUrl) {
        // 删除已有
        finalReceiptUrl = null;
      }

      // UPDATE 必须手动传 updated_at（DEFAULT now() 只对 INSERT 生效）
      const updatePayload: Record<string, unknown> = {
        applicant_name: applicantName.trim(),
        category,
        amount: Number(amount),
        summary: summary.trim(),
        updated_at: new Date().toISOString(),
      };
      if (finalReceiptUrl !== undefined) {
        updatePayload.receipt_url = finalReceiptUrl;
      }

      const { error } = await supabase
        .from('expense_applications')
        .update(updatePayload)
        .eq('id', id)
        .eq('status', 'draft');  // 双重保险：只允许 draft 状态被改

      if (error) {
        setSaveError(error.message);
        return;
      }

      // DB 写入成功后，删除孤儿文件（旧凭证）
      // 注意：如果删除失败也不阻塞用户，只在控制台 warn
      if ((newReceiptFile || removeExisting) && originalUrl) {
        try {
          await deleteReceiptByUrl(originalUrl);
        } catch (delErr) {
          console.warn('删除旧凭证文件失败（数据已更新成功）:', delErr);
        }
      }

      router.push(`/applications/${id}`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="min-h-screen p-8 max-w-2xl mx-auto"><p className="text-gray-500">加载中…</p></main>;
  }

  if (loadError) {
    return (
      <main className="min-h-screen p-8 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-300 rounded p-3 text-red-800 text-sm">
          加载失败：{loadError}
        </div>
      </main>
    );
  }

  if (!app) {
    return (
      <main className="min-h-screen p-8 max-w-2xl mx-auto">
        <div className="border border-dashed border-gray-300 rounded p-8 text-center text-gray-500">
          申请单不存在
        </div>
      </main>
    );
  }

  // 仅 draft 可编辑
  if (app.status !== 'draft') {
    return (
      <main className="min-h-screen p-8 max-w-2xl mx-auto">
        <div className="mb-4">
          <Link href={`/applications/${id}`} className="text-blue-600 hover:underline text-sm">← 返回详情</Link>
        </div>
        <div className="bg-yellow-50 border border-yellow-300 rounded p-5">
          <h1 className="text-lg font-bold text-yellow-800 mb-2">⚠️ 无法编辑</h1>
          <p className="text-yellow-800 text-sm">
            当前状态为 <StatusBadge status={app.status} />，只有"草稿"状态的申请可以编辑。
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <div className="mb-4">
        <Link href={`/applications/${id}`} className="text-blue-600 hover:underline text-sm">← 返回详情</Link>
      </div>
      <h1 className="text-2xl font-bold mb-2">编辑草稿</h1>
      <p className="text-xs text-gray-500 font-mono mb-6">ID: {id}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-1">
            申请人姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving}
          />
          {errors.applicant_name && <p className="text-red-600 text-sm mt-1">{errors.applicant_name}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            类别 <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
            disabled={saving}
          >
            <option value="">— 请选择 —</option>
            {Object.entries(CATEGORY_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            金额（元） <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            disabled={saving}
          />
          {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            摘要 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2"
            disabled={saving}
          />
          {errors.summary && <p className="text-red-600 text-sm mt-1">{errors.summary}</p>}
        </div>

        <ReceiptUploader
          newFile={newReceiptFile}
          onNewFileChange={(file, err) => {
            setNewReceiptFile(file);
            setReceiptError(err);
            if (file) setRemoveExisting(false);  // 选了新文件就清除"删除"意图
          }}
          existingUrl={removeExisting ? null : existingReceiptUrl}
          onRemoveExisting={() => {
            setRemoveExisting(true);
            setNewReceiptFile(null);
            setReceiptError(null);
          }}
          validationError={receiptError}
          disabled={saving}
        />

        {saveError && (
          <div className="bg-red-50 border border-red-300 rounded p-3">
            <p className="text-red-800 text-sm">保存失败：{saveError}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded font-semibold"
          >
            {saving ? '保存中…' : '保存修改'}
          </button>
          <Link
            href={`/applications/${id}`}
            className="border border-gray-400 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded inline-flex items-center"
          >
            取消
          </Link>
        </div>
      </form>
    </main>
  );
}
