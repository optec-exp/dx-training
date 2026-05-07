import ClientList from './ClientList';

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

export default async function ClientsPage() {
  const clients = await fetchClients();

  return (
    <main className="min-h-screen" style={{background:'#f4f4f2'}}>
      {/* ヘッダー */}
      <header style={{background:'#0a1628'}} className="px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase" style={{color:'#c9a84c'}}>OPTEC Customer Database</p>
          <h1 className="text-xl font-bold text-white mt-0.5">顧客一覧</h1>
        </div>
        <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{background:'rgba(201,168,76,0.15)', color:'#c9a84c'}}>
          {clients.length} 社
        </span>
      </header>

      {clients.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">データが見つかりませんでした</p>
          <p className="text-sm mt-1">.env.local の設定を確認してください</p>
        </div>
      ) : (
        <ClientList clients={clients} />
      )}
    </main>
  );
}
