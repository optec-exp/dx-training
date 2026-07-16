"use client";

import type { Currency } from "@/lib/types";
import { useLang } from "./LanguageProvider";

interface Props {
  value: Currency;
  onChange: (v: Currency) => void;
}

export function CurrencyToggle({ value, onChange }: Props) {
  const { t } = useLang();
  return (
    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange("jpy")}
        className={`px-3 py-1 text-sm font-medium rounded-md transition ${
          value === "jpy"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        JPY
      </button>
      <button
        type="button"
        onClick={() => onChange("cny")}
        className={`px-3 py-1 text-sm font-medium rounded-md transition ${
          value === "cny"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        CNY<span className="text-[10px] opacity-80 ml-0.5">{t("currencyRefSuffix")}</span>
      </button>
    </div>
  );
}
