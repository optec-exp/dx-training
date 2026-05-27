'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, ASSET_CATEGORIES, type AssetCategory } from '@/lib/supabase';

export default function NewItemPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('PC');
  const [assetCode, setAssetCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !assetCode.trim()) {
      setError('物品名称和资产编号不能为空');
      return;
    }

    setSubmitting(true);
    const { error: err } = await supabase.from('items').insert({
      name: name.trim(),
      category,
      asset_code: assetCode.trim(),
    });
    setSubmitting(false);

    if (err) {
      if (err.code === '23505') {
        setError(`资产编号「${assetCode.trim()}」已存在，请使用其他编号`);
      } else {
        setError(err.message);
      }
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">
          ← 返回列表
        </Link>

        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">新增物品</h1>
          <p className="text-sm text-slate-500 mb-6">登录后默认状态为「可用」</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <Field label="物品名称" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：ThinkPad X1 Carbon"
                maxLength={100}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </Field>

            <Field label="分类" required>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ASSET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="资产编号" required hint="唯一标识（如 PC-001、MON-002）">
              <input
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                placeholder="例：PC-001"
                maxLength={50}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </Field>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? '登录中...' : '登录'}
              </button>
              <Link
                href="/"
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition"
              >
                取消
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}
