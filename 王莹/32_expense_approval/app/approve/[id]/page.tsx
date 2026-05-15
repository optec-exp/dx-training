"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Record = {
  id: string;
  申请人姓名: string;
  所属部门: string;
  费用项目: string;
  物品名称: string;
  数量: string;
  预估金额: string;
  收款方: string;
  支付方式: string;
  申请理由: string;
  申请时间: string;
  处理结果: string;
};

type ApproveResult = {
  success: boolean;
  decision?: string;
  error?: string;
};

export default function ApprovePage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApproveResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/record/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setRecord(data.record);
        else setError("申請情報の取得に失敗しました");
      })
      .catch(() => setError("ネットワークエラー"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDecision(decision: "approve" | "reject") {
    if (!record) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: id,
          decision,
          comment,
          applicantName: record.申请人姓名,
          applyDate: record.申请时间,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: "送信エラー" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 text-sm">申請情報を読み込み中...</div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-sm">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-red-700 font-medium">{error || "申請が見つかりません"}</p>
        </div>
      </div>
    );
  }

  if (record.处理结果 && !result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center max-w-sm w-full">
          <div className="text-3xl mb-3">📋</div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">この申請は処理済みです</h2>
          <p className="text-sm text-slate-500">処理結果：{record.处理结果}</p>
        </div>
      </div>
    );
  }

  if (result) {
    const approved = result.decision === "承認済";
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center max-w-sm w-full">
          <div className="text-4xl mb-4">{approved ? "✅" : "❌"}</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {approved ? "承認しました" : "却下しました"}
          </h2>
          <p className="text-sm text-slate-500 mb-4">申請番号：<span className="font-mono font-bold text-blue-700">#{id}</span></p>
          <div className="bg-slate-50 rounded-lg p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>✓</span> Kintone の処理結果を更新しました
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>✓</span> Google Sheets の審批状態を更新しました
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>✓</span> 申請者に Slack 通知を送信しました
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-700 text-white py-4 px-6 shadow-md">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold">⚖️ 販管費申請 審批</h1>
          <p className="text-blue-200 text-sm mt-0.5">申請番号 #{id}</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto py-8 px-4 space-y-4">
        {/* 申請内容カード */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
            📋 申請内容
          </h2>
          <dl className="space-y-3">
            {[
              ["申請者", `${record.申请人姓名}（${record.所属部门}）`],
              ["申請日", record.申请时间],
              ["費用項目", record.费用项目],
              ["物品・サービス", `${record.物品名称} × ${record.数量}`],
              ["予算金額", `¥${Number(record.预估金额).toLocaleString()} CNY`],
              ["収款方", record.收款方],
              ["支払方式", record.支付方式],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <dt className="text-xs text-slate-500 w-24 shrink-0 pt-0.5">{label}</dt>
                <dd className="text-sm text-slate-800 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1">申請理由</p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{record.申请理由}</p>
          </div>
        </div>

        {/* コメント */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            審批コメント（任意）
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="承認または却下の理由を入力してください"
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* 審批ボタン */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleDecision("reject")}
            disabled={submitting}
            className="bg-white hover:bg-red-50 disabled:opacity-50 border-2 border-red-300 text-red-600 py-3 rounded-xl text-base font-semibold transition-colors"
          >
            {submitting ? "処理中..." : "❌ 却下"}
          </button>
          <button
            onClick={() => handleDecision("approve")}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl text-base font-semibold transition-colors shadow-sm"
          >
            {submitting ? "処理中..." : "✅ 承認"}
          </button>
        </div>
      </main>
    </div>
  );
}
