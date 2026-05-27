'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  supabase,
  ASSET_CATEGORIES,
  type Item,
  type BorrowRecord,
  type AssetCategory,
  type AssetStatus,
} from '@/lib/supabase';
import { StatusBadge } from '@/app/components/StatusBadge';
import { BorrowDialog } from '@/app/components/BorrowDialog';
import { formatDate, formatDateTime, getDueStatus } from '@/lib/utils';

type StatusAction = {
  label: string;
  newStatus: AssetStatus;
  variant: 'primary' | 'warning' | 'danger';
};

function getStatusActions(s: AssetStatus): StatusAction[] {
  switch (s) {
    case 'available':
      return [
        { label: '送修', newStatus: 'repairing', variant: 'warning' },
        { label: '报废', newStatus: 'scrapped', variant: 'danger' },
      ];
    case 'repairing':
      return [
        { label: '修好（恢复可用）', newStatus: 'available', variant: 'primary' },
        { label: '报废', newStatus: 'scrapped', variant: 'danger' },
      ];
    case 'scrapped':
      return [{ label: '恢复使用', newStatus: 'available', variant: 'primary' }];
    case 'borrowed':
      return [];
  }
}

const VARIANT_CLASS: Record<StatusAction['variant'], string> = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white',
};

function lateReturnDays(expected: string, returned: string): number {
  const e = new Date(expected);
  const r = new Date(returned);
  const expectedDay = new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime();
  const returnDay = new Date(r.getFullYear(), r.getMonth(), r.getDate()).getTime();
  const diff = Math.round((returnDay - expectedDay) / 86400000);
  return diff > 0 ? diff : 0;
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [item, setItem] = useState<Item | null>(null);
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('PC');
  const [assetCode, setAssetCode] = useState('');

  const [savingEdit, setSavingEdit] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const [actionFeedback, setActionFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [returning, setReturning] = useState(false);

  const load = async () => {
    setLoading(true);
    const [itemRes, recordsRes] = await Promise.all([
      supabase.from('items').select('*').eq('id', id).single(),
      supabase
        .from('borrow_records')
        .select('*')
        .eq('item_id', id)
        .order('borrowed_at', { ascending: false }),
    ]);

    if (itemRes.error || !itemRes.data) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setItem(itemRes.data);
    setName(itemRes.data.name);
    setCategory(itemRes.data.category);
    setAssetCode(itemRes.data.asset_code);
    setRecords(recordsRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const onSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFeedback(null);

    if (!name.trim() || !assetCode.trim()) {
      setEditFeedback({ ok: false, msg: '名称和资产编号不能为空' });
      return;
    }

    setSavingEdit(true);
    const { error } = await supabase
      .from('items')
      .update({
        name: name.trim(),
        category,
        asset_code: assetCode.trim(),
      })
      .eq('id', id);
    setSavingEdit(false);

    if (error) {
      setEditFeedback({
        ok: false,
        msg: error.code === '23505' ? '资产编号已被占用' : error.message,
      });
      return;
    }

    setEditFeedback({ ok: true, msg: '已保存 ✓' });
    setTimeout(() => setEditFeedback(null), 2000);
    load();
  };

  const onChangeStatus = async (newStatus: AssetStatus, label: string) => {
    setActionFeedback(null);
    const { error } = await supabase.from('items').update({ status: newStatus }).eq('id', id);
    if (error) {
      setActionFeedback({ ok: false, msg: error.message });
      return;
    }
    setActionFeedback({ ok: true, msg: `已${label}` });
    setTimeout(() => setActionFeedback(null), 2000);
    load();
  };

  const onReturn = async (recordId: string) => {
    setActionFeedback(null);
    setReturning(true);
    const { error } = await supabase.rpc('return_item', { p_record_id: recordId });
    setReturning(false);
    if (error) {
      setActionFeedback({ ok: false, msg: error.message });
      return;
    }
    setActionFeedback({ ok: true, msg: '已归还' });
    setTimeout(() => setActionFeedback(null), 2000);
    load();
  };

  const onDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) {
      setActionFeedback({ ok: false, msg: error.message });
      setDeleting(false);
      setShowDeleteConfirm(false);
      return;
    }
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-2xl mx-auto animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-20 mb-4"></div>
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <div className="h-8 bg-slate-200 rounded w-1/2 mb-3"></div>
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>
      </main>
    );
  }

  if (notFound || !item) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="text-6xl mb-4 opacity-40">🔍</div>
          <p className="text-slate-500 mb-4">物品不存在或已被删除</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            返回列表
          </Link>
        </div>
      </main>
    );
  }

  const statusActions = getStatusActions(item.status);
  const currentBorrow = records.find((r) => r.returned_at === null);
  const currentDue = currentBorrow ? getDueStatus(currentBorrow.expected_return_at) : null;

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">
          ← 返回列表
        </Link>

        {/* 物品信息卡片 */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                {item.category}
              </span>
              <h1 className="text-2xl font-bold text-slate-800 mt-2">{item.name}</h1>
              <p className="text-sm text-slate-400 font-mono mt-1">{item.asset_code}</p>
            </div>
            <StatusBadge status={item.status} />
          </div>
          <p className="text-xs text-slate-400">登录于 {formatDateTime(item.created_at)}</p>
        </div>

        {/* 当前借出卡片（仅 borrowed 状态显示） */}
        {currentBorrow && (
          <section className="mt-6 bg-amber-50 rounded-2xl shadow-sm border-2 border-amber-200 p-6">
            <h2 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
              <span>📤</span> 当前借出
            </h2>

            <dl className="space-y-2.5 text-sm mb-5">
              <div className="flex justify-between">
                <dt className="text-slate-600">借用人</dt>
                <dd className="font-medium text-slate-800">{currentBorrow.borrower_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">借出时间</dt>
                <dd className="text-slate-800">{formatDateTime(currentBorrow.borrowed_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">预计归还</dt>
                <dd
                  className={
                    currentDue?.status === 'overdue'
                      ? 'text-rose-600 font-semibold'
                      : currentDue?.status === 'today'
                      ? 'text-amber-700 font-semibold'
                      : 'text-slate-800'
                  }
                >
                  {formatDate(currentBorrow.expected_return_at)}
                  {currentDue?.status === 'overdue' && ` (已超期 ${currentDue.daysOverdue} 天)`}
                  {currentDue?.status === 'today' && ' (今日到期)'}
                </dd>
              </div>
              {currentBorrow.note && (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-600 flex-shrink-0">备注</dt>
                  <dd className="text-slate-800 text-right">{currentBorrow.note}</dd>
                </div>
              )}
            </dl>

            <button
              onClick={() => onReturn(currentBorrow.id)}
              disabled={returning}
              className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {returning ? '处理中...' : '✓ 确认归还'}
            </button>
          </section>
        )}

        {/* 状态操作区 */}
        <section className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">状态操作</h2>

          {item.status === 'borrowed' && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              物品当前借出中，需先归还才能调整状态
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {statusActions.map((a) => (
              <button
                key={a.newStatus}
                onClick={() => onChangeStatus(a.newStatus, a.label)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${VARIANT_CLASS[a.variant]}`}
              >
                {a.label}
              </button>
            ))}

            <button
              onClick={() => setBorrowDialogOpen(true)}
              disabled={item.status !== 'available'}
              title={item.status === 'available' ? '借出此物品' : '当前状态不可借出'}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              借出
            </button>
          </div>

          {actionFeedback && (
            <div
              className={`mt-3 p-2.5 rounded-lg text-sm ${
                actionFeedback.ok
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              {actionFeedback.msg}
            </div>
          )}
        </section>

        {/* 编辑表单 */}
        <section className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">编辑信息</h2>
          <form onSubmit={onSaveEdit} className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">物品名称</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">分类</span>
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
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">资产编号</span>
              <input
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            {editFeedback && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  editFeedback.ok
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}
              >
                {editFeedback.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={savingEdit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {savingEdit ? '保存中...' : '保存修改'}
            </button>
          </form>
        </section>

        {/* 借出历史 */}
        <section className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <span>📋</span> 借出历史
            <span className="text-sm font-normal text-slate-400">（共 {records.length} 条）</span>
          </h2>
          <p className="text-xs text-slate-500 mb-4">按借出时间倒序排列</p>

          {records.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              这件物品还没有借出过
            </div>
          ) : (
            <ul className="space-y-3">
              {records.map((r) => {
                const isCurrent = r.returned_at === null;
                const late = r.returned_at ? lateReturnDays(r.expected_return_at, r.returned_at) : 0;
                return (
                  <li
                    key={r.id}
                    className={`p-3.5 rounded-lg border ${
                      isCurrent
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-800">{r.borrower_name}</span>
                      {isCurrent ? (
                        <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded font-medium">
                          当前借出
                        </span>
                      ) : late > 0 ? (
                        <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded font-medium">
                          迟交 {late} 天
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">
                          按时归还
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5">
                      <div>
                        借出：{formatDate(r.borrowed_at)} → 归还：
                        {r.returned_at ? formatDate(r.returned_at) : '未归还'}
                        <span className="text-slate-400 ml-2">
                          预计归还 {formatDate(r.expected_return_at)}
                        </span>
                      </div>
                      {r.note && (
                        <div className="text-slate-500 italic">备注：{r.note}</div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 危险操作区 */}
        <section className="mt-6 bg-white rounded-2xl shadow-sm border border-rose-200 p-6">
          <h2 className="text-lg font-semibold text-rose-700 mb-2">删除物品</h2>
          <p className="text-sm text-slate-600 mb-4">
            删除后<span className="font-semibold text-rose-700">无法恢复</span>，
            该物品的所有借出历史也会被一并删除。
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-white border border-rose-300 text-rose-700 rounded-lg font-medium hover:bg-rose-50 transition"
            >
              删除此物品
            </button>
          ) : (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
              <p className="text-sm text-rose-800 font-medium mb-3">
                确认删除「{item.name}」（{item.asset_code}）？
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 disabled:opacity-50 transition"
                >
                  {deleting ? '删除中...' : '确认删除'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <BorrowDialog
        open={borrowDialogOpen}
        itemId={item.id}
        itemName={item.name}
        onClose={() => setBorrowDialogOpen(false)}
        onSuccess={load}
      />
    </main>
  );
}
