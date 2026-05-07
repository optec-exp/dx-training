'use client';

import { useState } from 'react';
import Link from 'next/link';

type KintoneRecord = {
  $id: { value: string };
  '会社名_現地名': { value: string };
  '会社名_英名': { value: string };
};

function getDisplayName(record: KintoneRecord): string {
  return (
    record['会社名_現地名'].value.trim() ||
    record['会社名_英名'].value.trim() ||
    '（名称未設定）'
  );
}

export default function ClientList({ clients }: { clients: KintoneRecord[] }) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? clients.filter((c) => {
        const q = query.toLowerCase();
        return (
          getDisplayName(c).toLowerCase().includes(q) ||
          c['会社名_英名'].value.toLowerCase().includes(q)
        );
      })
    : clients;

  return (
    <div className="p-6">
      {/* 搜索框 */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            type="text"
            placeholder="会社名で検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm text-slate-700 placeholder-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
              ✕
            </button>
          )}
        </div>
        {query && (
          <span className="text-sm text-slate-400 whitespace-nowrap">{filtered.length} 件ヒット</span>
        )}
      </div>

      {/* リスト */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          「{query}」に一致する顧客が見つかりませんでした
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((client) => {
            const localName = client['会社名_現地名'].value.trim();
            const engName = client['会社名_英名'].value.trim();
            const displayName = localName || engName || '（名称未設定）';
            const subName = localName && engName ? engName : '';
            const id = client.$id.value;
            return (
              <li key={id}>
                <Link href={`/clients/${id}`}
                  className="flex items-center justify-between bg-white px-5 py-3.5 rounded-lg shadow-sm border-l-4 hover:shadow-md transition-all group"
                  style={{borderLeftColor:'#c9a84c'}}>
                  <div>
                    <p className="font-semibold group-hover:text-[#0a1628] transition-colors leading-snug" style={{color:'#1a2a42'}}>
                      {displayName}
                    </p>
                    {subName && (
                      <p className="text-xs mt-0.5" style={{color:'#c9a84c'}}>{subName}</p>
                    )}
                  </div>
                  <svg className="w-4 h-4 flex-shrink-0 ml-4 transition-colors" style={{color:'#c9a84c'}}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
