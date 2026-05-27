'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Props = {
  open: boolean;
  itemId: string;
  itemName: string;
  onClose: () => void;
  onSuccess: () => void;
};

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return ymd(d);
}

function todayStr(): string {
  return ymd(new Date());
}

export function BorrowDialog({ open, itemId, itemName, onClose, onSuccess }: Props) {
  const [borrower, setBorrower] = useState('');
  const [expectedDate, setExpectedDate] = useState(tomorrowStr());
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setBorrower('');
      setExpectedDate(tomorrowStr());
      setNote('');
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!borrower.trim()) {
      setError('请填写借用人姓名');
      return;
    }
    if (expectedDate < todayStr()) {
      setError('预计归还日不能早于今天');
      return;
    }

    setSubmitting(true);
    const expectedIso = new Date(`${expectedDate}T23:59:59`).toISOString();

    const { error: err } = await supabase.rpc('borrow_item', {
      p_item_id: itemId,
      p_borrower_name: borrower.trim(),
      p_expected_return_at: expectedIso,
      p_note: note.trim() || null,
    });
    setSubmitting(false);

    if (err) {
      setError(err.message);
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-800">借出物品</h2>
          <p className="text-sm text-slate-500 mt-0.5">「{itemName}」</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">
              借用人姓名 <span className="text-rose-500">*</span>
            </span>
            <input
              value={borrower}
              onChange={(e) => setBorrower(e.target.value)}
              placeholder="例：田中太郎"
              autoFocus
              maxLength={50}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">
              预计归还日期 <span className="text-rose-500">*</span>
            </span>
            <input
              type="date"
              value={expectedDate}
              min={todayStr()}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">备注</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="可选，例：出差用"
              rows={2}
              maxLength={200}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </label>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? '处理中...' : '确认借出'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 disabled:opacity-50 transition"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
