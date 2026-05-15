import ExpenseForm from "./components/ExpenseForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-700 text-white py-4 px-6 shadow-md">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold tracking-wide">📋 販管費申請システム</h1>
          <p className="text-blue-200 text-sm mt-0.5">費用申請 → Kintone登録 → 審批通知 → 台账追記</p>
        </div>
      </header>
      <main className="max-w-2xl mx-auto py-8 px-4">
        <ExpenseForm />
      </main>
    </div>
  );
}
