'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase, type Item, type BorrowRecord } from '@/lib/supabase';
import { ItemCard } from './components/ItemCard';
import { StatusFilter, type StatusFilterValue } from './components/StatusFilter';
import { EmptyState } from './components/EmptyState';

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [currentBorrows, setCurrentBorrows] = useState<Record<string, BorrowRecord>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilterValue>('all');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErrorMsg(null);

      const [itemsRes, borrowsRes] = await Promise.all([
        supabase.from('items').select('*').order('created_at', { ascending: false }),
        supabase.from('borrow_records').select('*').is('returned_at', null),
      ]);

      if (!alive) return;

      if (itemsRes.error) {
        setErrorMsg(`物品列表加载失败：${itemsRes.error.message}`);
        setLoading(false);
        return;
      }
      if (borrowsRes.error) {
        setErrorMsg(`借出记录加载失败：${borrowsRes.error.message}`);
        setLoading(false);
        return;
      }

      const borrowMap: Record<string, BorrowRecord> = {};
      for (const b of borrowsRes.data ?? []) {
        borrowMap[b.item_id] = b;
      }

      setItems(itemsRes.data ?? []);
      setCurrentBorrows(borrowMap);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const counts = useMemo(() => {
    const c: Record<StatusFilterValue, number> = {
      all: items.length,
      available: 0,
      borrowed: 0,
      repairing: 0,
      scrapped: 0,
    };
    for (const it of items) c[it.status]++;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((it) => it.status === filter);
  }, [items, filter]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <span>📦</span> 社内物品借出管理
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              PC・显示器・办公设备的借出与归还
            </p>
          </div>
          <Link
            href="/items/new"
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium shadow-sm hover:bg-indigo-700 transition"
          >
            + 新增物品
          </Link>
        </header>

        <section className="mb-6">
          <StatusFilter value={filter} onChange={setFilter} counts={counts} />
        </section>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
            {errorMsg}
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-5 h-44 animate-pulse"
              >
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-slate-200 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <EmptyState
              message={
                items.length === 0
                  ? '还没有任何物品，点击右上角「+ 新增物品」开始登录'
                  : '当前筛选下没有物品'
              }
            />
          ) : (
            filtered.map((item) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="block focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
              >
                <ItemCard item={item} currentBorrow={currentBorrows[item.id]} />
              </Link>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
