"use client";

import { useLang } from "./LanguageProvider";

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => setLang("zh")}
        className={`px-2.5 py-1 text-sm font-medium rounded-md transition ${
          lang === "zh"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        aria-pressed={lang === "zh"}
      >
        中文
      </button>
      <button
        type="button"
        onClick={() => setLang("ja")}
        className={`px-2.5 py-1 text-sm font-medium rounded-md transition ${
          lang === "ja"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        aria-pressed={lang === "ja"}
      >
        日本語
      </button>
    </div>
  );
}
