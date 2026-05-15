"use client";

import { useState } from "react";

type FormData = {
  申请人姓名: string;
  所属公司: string;
  所属部门: string;
  申请人职位: string;
  费用项目: string;
  物品名称: string;
  数量: string;
  预估金额: string;
  收款方: string;
  支付方式: string;
  申请理由: string;
};

type SubmitResult = {
  success: boolean;
  recordId?: string;
  error?: string;
};

const COMPANIES = ["烟台公司", "上海公司", "香港公司", "オプテックエクスプレス株式会社", "オプテックトレーディング株式会社"];
const DEPARTMENTS = ["OS课", "GC室", "财务室", "总务人事室", "DX室（中国）", "物流开发室", "Marketing", "营业课（中国）", "治理室", "管理部"];
const POSITIONS = ["员工", "主管", "经理", "部长", "总经理"];
const PAYMENT_METHODS = ["支付宝", "微信", "現金", "銀行"];

const initialForm: FormData = {
  申请人姓名: "",
  所属公司: "烟台公司",
  所属部门: "",
  申请人职位: "员工",
  费用项目: "",
  物品名称: "",
  数量: "1",
  预估金额: "",
  收款方: "",
  支付方式: "支付宝",
  申请理由: "",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white";
const selectClass = inputClass;

export default function ExpenseForm() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  function set(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: "ネットワークエラーが発生しました" });
    } finally {
      setLoading(false);
    }
  }

  if (result?.success) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">申請が完了しました</h2>
        <p className="text-slate-500 text-sm mb-6">申請番号：<span className="font-mono font-bold text-blue-700">#{result.recordId}</span></p>
        <div className="bg-slate-50 rounded-lg p-4 text-left space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="text-blue-500">✓</span> Kintone App #620 に登録しました
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="text-green-500">✓</span> 審批担当者に Slack 通知を送信しました
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="text-purple-500">✓</span> Google Sheets 台账に記録しました
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-6">審批結果は Slack でお知らせします</p>
        <button
          onClick={() => { setResult(null); setForm(initialForm); }}
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          新しい申請を作成
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {result?.success === false && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          エラー：{result.error}
        </div>
      )}

      {/* 申請者情報 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          👤 申請者情報
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="申請者氏名" required>
              <input
                type="text"
                value={form.申请人姓名}
                onChange={(e) => set("申请人姓名", e.target.value)}
                placeholder="例：王莹"
                required
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="所属会社" required>
            <select value={form.所属公司} onChange={(e) => set("所属公司", e.target.value)} className={selectClass}>
              {COMPANIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="所属部门" required>
            <select value={form.所属部门} onChange={(e) => set("所属部门", e.target.value)} required className={selectClass}>
              <option value="">-- 選択してください --</option>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="申請者職位" required>
            <select value={form.申请人职位} onChange={(e) => set("申请人职位", e.target.value)} className={selectClass}>
              {POSITIONS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* 費用明細 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          💴 費用明細
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="費用項目" required>
              <input
                type="text"
                value={form.费用项目}
                onChange={(e) => set("费用项目", e.target.value)}
                placeholder="例：消耗品費、交通費、接待費"
                required
                className={inputClass}
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="物品・サービス名" required>
              <input
                type="text"
                value={form.物品名称}
                onChange={(e) => set("物品名称", e.target.value)}
                placeholder="例：プリンター用紙 A4"
                required
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="数量" required>
            <input
              type="number"
              min="1"
              value={form.数量}
              onChange={(e) => set("数量", e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="予算金額（CNY）" required>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.预估金额}
              onChange={(e) => set("预估金额", e.target.value)}
              placeholder="0.00"
              required
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      {/* 支払情報 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          💳 支払情報
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="収款方（支払先）" required>
              <input
                type="text"
                value={form.收款方}
                onChange={(e) => set("收款方", e.target.value)}
                placeholder="例：山田文具店"
                required
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="支払方式" required>
            <select value={form.支付方式} onChange={(e) => set("支付方式", e.target.value)} className={selectClass}>
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* 申請理由 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          📝 申請理由
        </h2>
        <Field label="費用発生理由・用途" required>
          <textarea
            value={form.申请理由}
            onChange={(e) => set("申请理由", e.target.value)}
            placeholder="費用の発生理由と具体的な用途を入力してください"
            required
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-3 rounded-xl text-base font-semibold transition-colors shadow-sm"
      >
        {loading ? "送信中..." : "申請を提出する →"}
      </button>
    </form>
  );
}
