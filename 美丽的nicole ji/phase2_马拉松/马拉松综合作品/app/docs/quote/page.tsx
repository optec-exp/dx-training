"use client";
import { useState, useEffect } from "react";

interface Case {
  id: string;
  case_no: string;
  case_name: string;
  client: string;
  description: string;
}

interface QuoteItem {
  id: string;
  case_no: string;
  case_name: string;
  client: string;
  description: string;
  unit_price: number;
  qty: number;
  subtotal: number;
}

export default function QuotePage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<Record<string, { unit_price: number; qty: number }>>({});
  const [quoteTo, setQuoteTo] = useState("");
  const [validDays, setValidDays] = useState(30);
  const [showQuote, setShowQuote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/cases")
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setCases(d.cases ?? []); })
      .catch(() => setError("案件取得失败"))
      .finally(() => setLoading(false));
  }, []);

  const toggleCase = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else { next.add(id); setItems(i => ({ ...i, [id]: i[id] ?? { unit_price: 0, qty: 1 } })); }
      return next;
    });
  };

  const updateItem = (id: string, field: "unit_price" | "qty", val: number) => {
    setItems(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  };

  const quoteItems: QuoteItem[] = cases
    .filter(c => selected.has(c.id))
    .map(c => {
      const { unit_price = 0, qty = 1 } = items[c.id] ?? {};
      return { ...c, unit_price, qty, subtotal: unit_price * qty };
    });

  const total = quoteItems.reduce((sum, i) => sum + i.subtotal, 0);
  const tax = Math.floor(total * 0.1);
  const totalWithTax = total + tax;

  const today = new Date();
  const validUntil = new Date(today);
  validUntil.setDate(today.getDate() + validDays);
  const fmt = (d: Date) => d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  return (
      <div className="max-w-5xl mx-auto">
        {!showQuote ? (
          <div className="bg-white rounded-2xl shadow p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">一键报价单</h1>
            <p className="text-sm text-gray-500 mb-6">从 Kintone 选择案件，填写单价后生成可打印报价单</p>

            {/* 报价对象 */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">报价对象（客户名）</label>
                <input
                  type="text" value={quoteTo} onChange={e => setQuoteTo(e.target.value)}
                  placeholder="株式会社〇〇〇"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">有效期（天）</label>
                <input
                  type="number" value={validDays} onChange={e => setValidDays(Number(e.target.value))}
                  min={1} max={365}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {loading && <p className="text-gray-400 text-center py-4">加载案件中...</p>}

            {/* 案件选择 */}
            {!loading && cases.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">选择案件（可多选）</p>
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                  {cases.map(c => (
                    <div
                      key={c.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition ${selected.has(c.id) ? "bg-blue-50" : ""}`}
                      onClick={() => toggleCase(c.id)}
                    >
                      <input
                        type="checkbox" checked={selected.has(c.id)} readOnly
                        className="w-4 h-4 accent-blue-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          [{c.case_no}] {c.case_name}
                        </p>
                        <p className="text-xs text-gray-400">{c.client}</p>
                      </div>
                      {selected.has(c.id) && (
                        <div className="flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                          <div>
                            <label className="block text-xs text-gray-500">单价</label>
                            <input
                              type="number" min={0}
                              value={items[c.id]?.unit_price ?? 0}
                              onChange={e => updateItem(c.id, "unit_price", Number(e.target.value))}
                              className="w-24 border border-gray-300 rounded px-2 py-1 text-xs text-right"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500">数量</label>
                            <input
                              type="number" min={1}
                              value={items[c.id]?.qty ?? 1}
                              onChange={e => updateItem(c.id, "qty", Number(e.target.value))}
                              className="w-16 border border-gray-300 rounded px-2 py-1 text-xs text-right"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              disabled={selected.size === 0}
              onClick={() => setShowQuote(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-xl font-medium"
            >
              生成报价单（{selected.size} 件，合计 ¥{totalWithTax.toLocaleString()}）
            </button>
          </div>
        ) : (
          /* 报价单打印视图 */
          <div className="bg-white rounded-2xl shadow p-10 print:shadow-none print:rounded-none">
            <div className="flex justify-between items-start mb-8 print:hidden">
              <button onClick={() => setShowQuote(false)} className="text-blue-600 hover:underline text-sm">← 返回编辑</button>
              <button onClick={() => window.print()} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium">
                打印 / 保存 PDF
              </button>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">御 見 積 書</h2>
            </div>

            <div className="flex justify-between mb-8">
              <div>
                <p className="text-lg font-bold text-gray-800">{quoteTo || "〇〇〇 御中"}</p>
                <p className="text-sm text-gray-500 mt-1">下記のとおりお見積り申し上げます。</p>
              </div>
              <div className="text-right text-sm text-gray-600 space-y-1">
                <p>見積日：{fmt(today)}</p>
                <p>有効期限：{fmt(validUntil)}</p>
              </div>
            </div>

            {/* 金額サマリー */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-right">
              <p className="text-sm text-gray-500">お見積り金額（税込）</p>
              <p className="text-4xl font-bold text-gray-900">¥{totalWithTax.toLocaleString()}</p>
            </div>

            <table className="w-full text-sm border-collapse mb-6">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="text-left p-3">品目 / 案件名</th>
                  <th className="text-right p-3">単価</th>
                  <th className="text-right p-3">数量</th>
                  <th className="text-right p-3">小計</th>
                </tr>
              </thead>
              <tbody>
                {quoteItems.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-3 border border-gray-200">
                      <p className="font-medium">{item.case_name}</p>
                      <p className="text-xs text-gray-400">{item.case_no} · {item.client}</p>
                    </td>
                    <td className="p-3 border border-gray-200 text-right">¥{item.unit_price.toLocaleString()}</td>
                    <td className="p-3 border border-gray-200 text-right">{item.qty}</td>
                    <td className="p-3 border border-gray-200 text-right font-medium">¥{item.subtotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="p-3 border border-gray-200 text-right text-gray-600">小計</td>
                  <td className="p-3 border border-gray-200 text-right">¥{total.toLocaleString()}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="p-3 border border-gray-200 text-right text-gray-600">消費税（10%）</td>
                  <td className="p-3 border border-gray-200 text-right">¥{tax.toLocaleString()}</td>
                </tr>
                <tr className="bg-gray-800 text-white font-bold">
                  <td colSpan={3} className="p-3 text-right">合計（税込）</td>
                  <td className="p-3 text-right">¥{totalWithTax.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            <p className="text-xs text-gray-400 text-right" suppressHydrationWarning>自動生成：{new Date().toLocaleString("zh-CN")}</p>
          </div>
        )}
      </div>
  );
}
