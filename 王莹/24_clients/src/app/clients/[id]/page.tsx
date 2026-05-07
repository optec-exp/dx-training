import Link from 'next/link';

type CaseRecord = {
  $id: { value: string };
  '当社案件番号': { value: string };
  '請求日': { value: string };
  '案件取消': { value: string[] };
  '円換算粗利益': { value: string };
};

type ClientDetail = {
  clientName: string;
  cases: CaseRecord[];
};

async function fetchClientDetail(id: string): Promise<ClientDetail | null> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3012';
  const res = await fetch(`${base}/api/clients/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(num);
}

function formatDate(value: string): string {
  if (!value) return '—';
  // ISO datetime "2026-01-27T09:00:00Z" → "2026/01/27"
  return value.substring(0, 10).replace(/-/g, '/');
}

function CancelBadge({ value }: { value: string[] }) {
  const cancelled = Array.isArray(value) && value.length > 0;
  return cancelled ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
      キャンセル
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
      正常
    </span>
  );
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await fetchClientDetail(id);

  if (!detail) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-xl">顧客が見つかりませんでした</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
            ← 一覧へ戻る
          </Link>
        </div>
      </main>
    );
  }

  const { clientName, cases } = detail;

  // 粗利益合計
  const totalProfit = cases.reduce((sum, c) => {
    const v = parseFloat(c['円換算粗利益'].value);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-3 transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          顧客一覧
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">{clientName}</h1>
        <p className="text-sm text-gray-500 mt-0.5">案件履歴</p>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* サマリーカード */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm px-5 py-4">
            <p className="text-xs text-gray-500 mb-1">案件数</p>
            <p className="text-2xl font-bold text-gray-900">{cases.length} <span className="text-base font-normal text-gray-400">件</span></p>
          </div>
          <div className="bg-white rounded-xl shadow-sm px-5 py-4">
            <p className="text-xs text-gray-500 mb-1">円換算粗利益 合計</p>
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
              {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(totalProfit)}
            </p>
          </div>
        </div>

        {/* 案件テーブル */}
        {cases.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm px-5 py-16 text-center text-gray-400">
            <p>この顧客の案件履歴はありません</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">当社案件番号</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">請求日</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ステータス</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">円換算粗利益</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cases.map((c) => {
                  const profit = parseFloat(c['円換算粗利益'].value);
                  const profitColor = isNaN(profit) ? 'text-gray-400' : profit >= 0 ? 'text-gray-900' : 'text-red-600';
                  return (
                    <tr key={c.$id.value} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-gray-800">{c['当社案件番号'].value || '—'}</td>
                      <td className="px-5 py-3.5 text-gray-600">{formatDate(c['請求日'].value)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <CancelBadge value={c['案件取消'].value} />
                      </td>
                      <td className={`px-5 py-3.5 text-right font-medium tabular-nums ${profitColor}`}>
                        {formatCurrency(c['円換算粗利益'].value)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
