"use client";

import { useState, useEffect, useRef } from "react";

type FormData = {
  費用項目: string;
  費用类型: string;
  費用: string;
  通貨: string;
  国別: string;
  取引日: string;
  支払期日: string;
  支払先: string;
  支払いチェック: boolean;
  支払日: string;
  支払額: string;
  支払方法: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;
type SubmitState = "idle" | "loading" | "success" | "error";

const INITIAL_FORM: FormData = {
  費用項目: "",
  費用类型: "",
  費用: "",
  通貨: "CNY",
  国別: "",
  取引日: "",
  支払期日: "",
  支払先: "",
  支払いチェック: false,
  支払日: "",
  支払額: "",
  支払方法: "",
};

const EXPENSE_ITEMS = [
  "出差费", "交通费", "员工工资", "员工福利费", "银行手续费",
  "招待费", "教育培训", "办公使用费", "房屋使用消耗费", "参会费",
];

const EXPENSE_TYPES = ["人工費", "业务维持费", "业务活动费", "人才とIT投資", "税金"];

const CURRENCIES = ["CNY", "JPY", "USD", "EUR", "HKD"];

const COUNTRIES = ["-----", "中国", "日本", "上海", "香港", "美国", "越南", "墨西哥", "中日全体"];

const PAYMENT_METHODS = ["-----", "振込", "引落", "小口現金", "Paild", "クレカ", "立替"];

export default function Home() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  // 支払先 Autocomplete
  const [payeeSuggestions, setPayeeSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [payeeLoading, setPayeeLoading] = useState(false);
  const payeeRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 支払日入力時に支払額を費用で自動補填
  useEffect(() => {
    if (form.支払日 && form.費用) {
      setForm((prev) => ({ ...prev, 支払額: prev.費用 }));
    }
  }, [form.支払日, form.費用]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // 支払先 検索
  const handlePayeeInput = (value: string) => {
    handleChange("支払先", value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setPayeeSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      setPayeeLoading(true);
      try {
        const res = await fetch(`/api/search-payee?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setPayeeSuggestions(data.items ?? []);
        setShowSuggestions(true);
      } finally { setPayeeLoading(false); }
    }, 300);
  };

  const selectPayee = (value: string) => {
    handleChange("支払先", value);
    setShowSuggestions(false);
    setPayeeSuggestions([]);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (payeeRef.current && !payeeRef.current.contains(e.target as Node))
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const validate = (): boolean => {
    const e: FormErrors = {};
    // 費用項目は Lookup フィールドのため Kintone 上で設定（必須チェックのみ UI で実施）
    if (!form.費用类型) e.費用类型 = "必須項目です";
    if (!form.費用.trim()) e.費用 = "必須項目です";
    else if (isNaN(Number(form.費用)) || Number(form.費用) <= 0) e.費用 = "正しい金額を入力してください";
    if (!form.通貨) e.通貨 = "必須項目です";
    if (!form.取引日) e.取引日 = "必須項目です";
    if (!form.支払期日) e.支払期日 = "必須項目です";
    if (!form.支払先.trim()) e.支払先 = "必須項目です";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitState("loading");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitState("success");
        setSubmitMessage(`レコード ID: ${data.id}`);
        setForm(INITIAL_FORM);
        setErrors({});
      } else {
        setSubmitState("error");
        setSubmitMessage(data.error ?? "登録に失敗しました");
      }
    } catch {
      setSubmitState("error");
      setSubmitMessage("ネットワークエラーが発生しました");
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setSubmitState("idle");
    setSubmitMessage("");
  };

  const inputClass = (field: keyof FormData) =>
    `w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      errors[field] ? "border-red-400 bg-red-50" : "border-slate-300 bg-white hover:border-slate-400"
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">販管費 登録フォーム</h1>
            <p className="text-xs text-slate-500">Kintone App #652 への入力</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {submitState === "success" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-green-700">登録が完了しました　{submitMessage}</p>
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">費用項目・支払先は Kintone 上で直接設定してください。</span>
                  <br />
                  <a
                    href={`https://si8qxbanrfkx.cybozu.com/k/652/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline mt-0.5 inline-block"
                  >
                    → Kintone App #652 を開く
                  </a>
                </p>
              </div>
              <button onClick={handleReset} className="mt-2 text-sm text-green-700 underline hover:no-underline">続けて登録する</button>
            </div>
          </div>
        )}
        {submitState === "error" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-red-700">エラーが発生しました</p>
              <p className="text-sm text-red-600 mt-0.5">{submitMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

            {/* ── 費用情報 ── */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">費用情報</h2>
            </div>
            <div className="px-6 py-5 space-y-4">

              {/* 費用項目 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">費用項目 <span className="text-red-500">*</span></label>
                <select value={form.費用項目} onChange={(e) => handleChange("費用項目", e.target.value)} className={inputClass("費用項目")}>
                  <option value="">選択してください</option>
                  {EXPENSE_ITEMS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                {errors.費用項目 && <p className="mt-1 text-xs text-red-500">{errors.費用項目}</p>}
                <p className="mt-1 text-xs text-slate-400">※ 登録後 Kintone 上で設定してください</p>
              </div>

              {/* 費用類型 + 国別 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">費用類型 <span className="text-red-500">*</span></label>
                  <select value={form.費用类型} onChange={(e) => handleChange("費用类型", e.target.value)} className={inputClass("費用类型")}>
                    <option value="">選択してください</option>
                    {EXPENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.費用类型 && <p className="mt-1 text-xs text-red-500">{errors.費用类型}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">国別</label>
                  <select value={form.国別} onChange={(e) => handleChange("国別", e.target.value)} className={inputClass("国別")}>
                    {COUNTRIES.map((c) => <option key={c} value={c === "-----" ? "" : c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* 費用 + 通貨 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">費用 <span className="text-red-500">*</span></label>
                  <input type="number" min="0" step="0.01" value={form.費用} onChange={(e) => handleChange("費用", e.target.value)} placeholder="例：9900" className={inputClass("費用")} />
                  {errors.費用 && <p className="mt-1 text-xs text-red-500">{errors.費用}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">通貨 <span className="text-red-500">*</span></label>
                  <select value={form.通貨} onChange={(e) => handleChange("通貨", e.target.value)} className={inputClass("通貨")}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ── 日付・取引情報 ── */}
            <div className="px-6 py-3 bg-slate-50 border-y border-slate-200">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">日付・取引情報</h2>
            </div>
            <div className="px-6 py-5 space-y-4">

              {/* 取引日 + 支払期日 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">取引日 <span className="text-red-500">*</span></label>
                  <input type="date" value={form.取引日} onChange={(e) => handleChange("取引日", e.target.value)} className={inputClass("取引日")} />
                  {errors.取引日 && <p className="mt-1 text-xs text-red-500">{errors.取引日}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">支払期日 <span className="text-red-500">*</span></label>
                  <input type="date" value={form.支払期日} onChange={(e) => handleChange("支払期日", e.target.value)} className={inputClass("支払期日")} />
                  {errors.支払期日 && <p className="mt-1 text-xs text-red-500">{errors.支払期日}</p>}
                </div>
              </div>

              {/* 支払先 Autocomplete */}
              <div ref={payeeRef} className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">支払先 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.支払先}
                    onChange={(e) => handlePayeeInput(e.target.value)}
                    onFocus={() => { if (payeeSuggestions.length > 0) setShowSuggestions(true); }}
                    placeholder="会社名を入力して検索..."
                    autoComplete="off"
                    className={`${inputClass("支払先")} pr-9`}
                  />
                  {payeeLoading && (
                    <svg className="absolute right-3 top-3 w-4 h-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </div>
                {showSuggestions && payeeSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {payeeSuggestions.map((item) => (
                      <li key={item} onMouseDown={() => selectPayee(item)} className="px-3.5 py-2.5 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {showSuggestions && !payeeLoading && payeeSuggestions.length === 0 && form.支払先.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg px-3.5 py-2.5 text-sm text-slate-400">
                    候補が見つかりません
                  </div>
                )}
                {errors.支払先 && <p className="mt-1 text-xs text-red-500">{errors.支払先}</p>}
                <p className="mt-1 text-xs text-slate-400">※ 支払先は登録後 Kintone 上で設定してください</p>
              </div>
            </div>

            {/* ── 支払情報 ── */}
            <div className="px-6 py-3 bg-slate-50 border-y border-slate-200">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">支払情報</h2>
            </div>
            <div className="px-6 py-5 space-y-4">

              {/* 支払日 + 支払方法 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">支払日</label>
                  <input type="date" value={form.支払日} onChange={(e) => handleChange("支払日", e.target.value)} className={inputClass("支払日")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">支払方法</label>
                  <select value={form.支払方法} onChange={(e) => handleChange("支払方法", e.target.value)} className={inputClass("支払方法")}>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m === "-----" ? "" : m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* 支払額 + 支払いチェック */}
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    支払額
                    {form.支払日 && <span className="ml-2 text-xs text-blue-500 font-normal">費用より自動入力</span>}
                  </label>
                  <input type="number" min="0" step="0.01" value={form.支払額} onChange={(e) => handleChange("支払額", e.target.value)} placeholder="例：9900" className={inputClass("支払額")} />
                </div>
                <div className="pb-2.5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={form.支払いチェック}
                        onChange={(e) => handleChange("支払いチェック", e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.支払いチェック ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white group-hover:border-blue-400"}`}>
                        {form.支払いチェック && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-700">支払済み</span>
                  </label>
                </div>
              </div>
            </div>

            {/* フッター */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button type="button" onClick={handleReset} className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                クリア
              </button>
              <button type="submit" disabled={submitState === "loading"} className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                {submitState === "loading" ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    登録中...
                  </>
                ) : "Kintoneに登録する"}
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400 text-right"><span className="text-red-400">*</span> は必須項目です</p>
        </form>
      </main>
    </div>
  );
}
