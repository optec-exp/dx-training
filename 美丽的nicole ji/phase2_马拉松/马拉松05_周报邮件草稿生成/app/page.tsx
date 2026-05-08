"use client";
import { useState } from "react";

interface Record { case_no: string; case_name: string; client: string; assignee: string; amount: number; status: string; }

function getWeekRange() {
  const now = new Date();
  const day = now.getDay() || 7;
  const mon = new Date(now); mon.setDate(now.getDate() - day + 1);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(mon), to: fmt(sun) };
}

export default function Home() {
  const { from: defFrom, to: defTo } = getWeekRange();
  const [from, setFrom] = useState(defFrom);
  const [to, setTo] = useState(defTo);
  const [records, setRecords] = useState<Record[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/report?from=${from}&to=${to}`);
      const data = await res.json();
      setRecords(data.records);
      setTotal(data.total);

      // 生成邮件草稿
      const lines = [
        "お世話になっております。",  // Keep formal Japanese greeting as it's standard business
        "",
        `【週報】${from} ～ ${to}`,
        "",
        `■ 今週の案件サマリー`,
        `　受付件数：${data.records.length} 件`,
        `　合計金額：¥${data.total.toLocaleString()}`,
        "",
        "■ 案件一覧",
        ...data.records.map((r: Record, i: number) =>
          `　${i + 1}. [${r.case_no || "-"}] ${r.case_name || "-"}（${r.client || "-"}）¥${r.amount?.toLocaleString() ?? 0} / ${r.status || "-"}`
        ),
        "",
        "以上、ご確認のほどよろしくお願いいたします。",
        "",
        `作成日：${new Date().toLocaleDateString("zh-CN")}`,
      ];
      setDraft(lines.join("\n"));
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">周报邮件草稿生成</h1>
        <p className="text-sm text-gray-500 mb-6">从 Kintone 拉取指定周数据，自动生成邮件正文</p>

        {/* 日期范围 */}
        <div className="flex gap-3 items-center mb-6">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-gray-400 rounded-lg px-3 py-2 text-gray-900" />
          <span className="text-gray-500">～</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-gray-400 rounded-lg px-3 py-2 text-gray-900" />
          <button onClick={generate} disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2 rounded-lg font-medium">
            {loading ? "生成中..." : "生成草稿"}
          </button>
        </div>

        {/* 统计 */}
        {records.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{records.length}</p>
              <p className="text-sm text-blue-500">本周案件数</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-700">¥{total.toLocaleString()}</p>
              <p className="text-sm text-green-500">合计金额</p>
            </div>
          </div>
        )}

        {/* 邮件草稿 */}
        {draft && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700">邮件正文（可直接复制）</p>
              <button onClick={copy}
                className={`text-sm px-4 py-1.5 rounded-lg font-medium transition ${
                  copied ? "bg-green-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}>
                {copied ? "已复制！" : "复制全文"}
              </button>
            </div>
            <textarea readOnly value={draft} rows={18}
              className="w-full border border-gray-300 rounded-xl p-4 text-sm font-mono text-gray-800 bg-gray-50 resize-none focus:outline-none" />
          </div>
        )}
      </div>
    </main>
  );
}
