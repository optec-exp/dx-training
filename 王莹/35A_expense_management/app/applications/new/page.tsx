'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { supabase, CATEGORY_LABELS, ExpenseApplication } from '@/lib/supabase';
import { ReceiptUploader } from '@/components/ReceiptUploader';
import { uploadReceipt } from '@/lib/storage';

type FormErrors = {
  applicant_name?: string;
  category?: string;
  amount?: string;
  summary?: string;
};

export default function NewApplicationPage() {
  const [applicantName, setApplicantName] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [summary, setSummary] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<ExpenseApplication | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!applicantName.trim()) e.applicant_name = '请填写申请人姓名';
    if (!category) e.category = '请选择类别';
    const amountNum = Number(amount);
    if (!amount.trim()) {
      e.amount = '请填写金额';
    } else if (isNaN(amountNum) || amountNum <= 0) {
      e.amount = '金额必须为大于 0 的数字';
    }
    if (!summary.trim()) e.summary = '请填写摘要';
    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setServerError(null);

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (receiptError) return;

    setSubmitting(true);
    try {
      // 先上传凭证（如有），再创建草稿
      let receiptUrl: string | null = null;
      if (receiptFile) {
        const { publicUrl } = await uploadReceipt(receiptFile);
        receiptUrl = publicUrl;
      }

      const { data, error } = await supabase.rpc('expense_create_draft', {
        p_applicant_name: applicantName.trim(),
        p_category: category,
        p_amount: Number(amount),
        p_summary: summary.trim(),
        p_receipt_url: receiptUrl,
      });

      if (error) {
        setServerError(error.message);
        return;
      }
      setCreated(data as ExpenseApplication);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setApplicantName('');
    setCategory('');
    setAmount('');
    setSummary('');
    setReceiptFile(null);
    setReceiptError(null);
    setErrors({});
    setCreated(null);
    setServerError(null);
  };

  if (created) {
    return (
      <main className="min-h-screen p-8 max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-300 rounded p-6 mb-4">
          <h1 className="text-xl font-bold text-green-800 mb-3">✓ 草稿创建成功</h1>
          <dl className="text-sm space-y-1 text-gray-800">
            <div><dt className="inline font-semibold">草稿 ID：</dt><dd className="inline ml-2 font-mono">{created.id}</dd></div>
            <div><dt className="inline font-semibold">申请人：</dt><dd className="inline ml-2">{created.applicant_name}</dd></div>
            <div><dt className="inline font-semibold">类别：</dt><dd className="inline ml-2">{CATEGORY_LABELS[created.category]}</dd></div>
            <div><dt className="inline font-semibold">金额：</dt><dd className="inline ml-2">¥ {Number(created.amount).toLocaleString()}</dd></div>
            <div><dt className="inline font-semibold">摘要：</dt><dd className="inline ml-2">{created.summary}</dd></div>
            <div><dt className="inline font-semibold">状态：</dt><dd className="inline ml-2">草稿</dd></div>
            <div><dt className="inline font-semibold">创建时间：</dt><dd className="inline ml-2">{new Date(created.created_at).toLocaleString()}</dd></div>
          </dl>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href={`/applications/${created.id}`}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded inline-flex items-center font-semibold"
          >
            查看详情 →
          </Link>
          <button
            onClick={resetForm}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            继续创建
          </button>
          <Link
            href="/applications"
            className="border border-gray-400 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded inline-flex items-center"
          >
            返回列表
          </Link>
          <Link
            href="/"
            className="border border-gray-400 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded inline-flex items-center"
          >
            回到首页
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline text-sm">← 返回首页</Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">新建费用申请草稿</h1>

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
            placeholder="请输入申请人姓名"
            disabled={submitting}
          />
          {errors.applicant_name && (
            <p className="text-red-600 text-sm mt-1">{errors.applicant_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            类别 <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            disabled={submitting}
          >
            <option value="">— 请选择 —</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-600 text-sm mt-1">{errors.category}</p>
          )}
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
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            disabled={submitting}
          />
          {errors.amount && (
            <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            摘要 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请描述费用用途"
            disabled={submitting}
          />
          {errors.summary && (
            <p className="text-red-600 text-sm mt-1">{errors.summary}</p>
          )}
        </div>

        <ReceiptUploader
          newFile={receiptFile}
          onNewFileChange={(file, err) => {
            setReceiptFile(file);
            setReceiptError(err);
          }}
          validationError={receiptError}
          disabled={submitting}
        />

        {serverError && (
          <div className="bg-red-50 border border-red-300 rounded p-3">
            <p className="text-red-800 text-sm">提交失败：{serverError}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded font-semibold"
          >
            {submitting ? '创建中…' : '创建草稿'}
          </button>
          <Link
            href="/"
            className="border border-gray-400 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded inline-flex items-center"
          >
            取消
          </Link>
        </div>

        <p className="text-xs text-gray-500 pt-2">
          说明：创建后为草稿状态，后续步骤将开发"提交申请"功能。
        </p>
      </form>
    </main>
  );
}
