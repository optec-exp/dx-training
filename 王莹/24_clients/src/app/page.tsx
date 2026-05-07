import Link from 'next/link';

type KintoneRecord = {
  $id: { value: string };
  '会社名_現地名': { value: string };
  '会社名_英名': { value: string };
};

async function fetchClients(): Promise<KintoneRecord[]> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3012';
  const res = await fetch(`${base}/api/clients`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

function getDisplayName(record: KintoneRecord): string {
  return (
    record['会社名_現地名'].value.trim() ||
    record['会社名_英名'].value.trim() ||
    '（名称未設定）'
  );
}

export default async function ClientsPage() {
  const clients = await fetchClients();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">顧客一覧</h1>
          <p className="text-xs text-gray-500">クリックで案件履歴を表示</p>
        </div>
        <span className="ml-auto text-sm text-gray-400">{clients.length} 社</span>
      </header>

      {/* リスト */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {clients.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">データが見つかりませんでした</p>
            <p className="text-sm mt-1">.env.local の設定を確認してください</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 bg-white rounded-xl shadow-sm overflow-hidden">
            {clients.map((client) => {
              const name = getDisplayName(client);
              const id = client.$id.value;
              const engName = client['会社名_英名'].value.trim();
              const localName = client['会社名_現地名'].value.trim();
              return (
                <li key={id}>
                  <Link
                    href={`/clients/${id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-semibold text-sm">
                        {name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                        {name}
                      </p>
                      {localName && engName && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{engName}</p>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0"
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
    </main>
  );
}
