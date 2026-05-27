import { type Item, type BorrowRecord } from '@/lib/supabase';
import { StatusBadge } from './StatusBadge';
import { formatDate, getDueStatus } from '@/lib/utils';

type Props = {
  item: Item;
  currentBorrow?: BorrowRecord;
};

export function ItemCard({ item, currentBorrow }: Props) {
  const due = currentBorrow ? getDueStatus(currentBorrow.expected_return_at) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
          {item.category}
        </span>
        <StatusBadge status={item.status} />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-800 leading-tight mb-1">
          {item.name}
        </h3>
        <p className="text-xs text-slate-400 font-mono">{item.asset_code}</p>
      </div>

      {currentBorrow ? (
        <div className="mt-1 pt-3 border-t border-slate-100 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">借用人</span>
            <span className="text-slate-800 font-medium">{currentBorrow.borrower_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">预计归还</span>
            <span
              className={
                due?.status === 'overdue'
                  ? 'text-rose-600 font-medium'
                  : due?.status === 'today'
                  ? 'text-amber-600 font-medium'
                  : 'text-slate-800'
              }
            >
              {formatDate(currentBorrow.expected_return_at)}
            </span>
          </div>
          {due?.status === 'overdue' && (
            <div className="mt-2 px-2.5 py-1.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 font-medium flex items-center gap-1.5">
              <span>🔴</span>
              <span>已超期 {due.daysOverdue} 天</span>
            </div>
          )}
          {due?.status === 'today' && (
            <div className="mt-2 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700 font-medium flex items-center gap-1.5">
              <span>⏰</span>
              <span>今日到期</span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-1 pt-3 border-t border-slate-100 text-xs text-slate-400">
          登录于 {formatDate(item.created_at)}
        </div>
      )}
    </div>
  );
}
