"use client";
import { useState, useEffect } from "react";

interface StockItem {
  item_code: string;
  item_name: string;
  current_stock: number;
  min_stock: number;
  unit: string;
  shortage: number;
}

export default function Home() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");

  const check = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/slack");
      const data = await res.json();
      if (data.error) setError(data.error);
      else { setItems(data.items ?? []); setChecked(true); }
    } catch {
      setError("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { check(); }, []);

  const critical = items.filter(i => i.current_stock === 0);
  const low = items.filter(i => i.current_stock > 0);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">库存不足通知</h1>
            <p className="text-sm text-gray-500 mt-1">显示低于最低库存量的商品</p>
          </div>
          <button
            onClick={check} disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2 rounded-lg text-sm font-medium"
          >
            {loading ? "检查中..." : "刷新库存"}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {checked && !error && items.length === 0 && (
          <div className="text-center py-12 text-green-600 font-medium text-lg">
            ✓ 当前所有商品库存充足
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-red-600">{critical.length}</p>
                <p className="text-sm text-red-400">零库存</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-orange-600">{low.length}</p>
                <p className="text-sm text-orange-400">库存不足</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-gray-600">{items.length}</p>
                <p className="text-sm text-gray-400">合计需补货</p>
              </div>
            </div>

            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="text-left p-3 border border-gray-200">商品コード</th>
                  <th className="text-left p-3 border border-gray-200">商品名</th>
                  <th className="text-right p-3 border border-gray-200">现有库存</th>
                  <th className="text-right p-3 border border-gray-200">最低库存</th>
                  <th className="text-right p-3 border border-gray-200">缺货量</th>
                  <th className="text-center p-3 border border-gray-200">状态</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={i} className={r.current_stock === 0 ? "bg-red-50" : "bg-orange-50"}>
                    <td className="p-3 border border-gray-200 font-mono text-xs">{r.item_code || "-"}</td>
                    <td className="p-3 border border-gray-200 font-medium">{r.item_name || "-"}</td>
                    <td className={`p-3 border border-gray-200 text-right font-bold ${r.current_stock === 0 ? "text-red-600" : "text-orange-600"}`}>
                      {r.current_stock} {r.unit}
                    </td>
                    <td className="p-3 border border-gray-200 text-right text-gray-500">{r.min_stock} {r.unit}</td>
                    <td className="p-3 border border-gray-200 text-right text-red-600 font-bold">{r.shortage} {r.unit}</td>
                    <td className="p-3 border border-gray-200 text-center">
                      {r.current_stock === 0
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">零库存</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">库存不足</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <p className="text-xs text-gray-400 mt-6 text-right">
          数据来源：Kintone · 检查时间：{new Date().toLocaleString("zh-CN")}
        </p>
      </div>
    </main>
  );
}
