"use client";

import { useCallback, useEffect, useState } from "react";

interface Props {
  year: number;
  month: number;
  disabled: boolean;
}

interface ToastState {
  type: "success" | "error";
  message: string;
  detail?: string;
}

export function ActionBar({ year, month, disabled }: Props) {
  const [slackSending, setSlackSending] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast || toast.type === "error") return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const downloadExcel = () => {
    window.open(`/api/export/excel?year=${year}&month=${month}`, "_blank");
  };

  const downloadPdf = () => {
    window.open(`/api/export/pdf?year=${year}&month=${month}`, "_blank");
  };

  const notifySlack = useCallback(async () => {
    if (!confirm(`确定要发送 ${year}年${month}月 的利润汇总到 Slack 吗？`)) return;
    setSlackSending(true);
    setToast(null);
    const startAt = Date.now();
    try {
      const res = await fetch("/api/slack/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      const elapsed = Date.now() - startAt;
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setToast({
          type: "success",
          message: `已发送到 Slack`,
          detail: `${year}年${month}月报告 · 耗时 ${(elapsed / 1000).toFixed(1)}s`,
        });
      } else {
        const errMsg = data.error ?? `HTTP ${res.status}`;
        console.error("[Slack notify] 发送失败:", {
          status: res.status,
          error: errMsg,
          year,
          month,
          elapsedMs: elapsed,
        });
        setToast({
          type: "error",
          message: "Slack 通知发送失败",
          detail: errMsg,
        });
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("[Slack notify] 请求异常:", e);
      setToast({
        type: "error",
        message: "Slack 通知请求异常",
        detail: errMsg,
      });
    } finally {
      setSlackSending(false);
    }
  }, [year, month]);

  const btn =
    "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <>
      <div className="flex items-center gap-3">
        <button type="button" onClick={downloadExcel} disabled={disabled} className={btn}>
          📊 Excel
        </button>
        <button type="button" onClick={downloadPdf} disabled={disabled} className={btn}>
          📄 PDF
        </button>
        <button
          type="button"
          onClick={notifySlack}
          disabled={disabled || slackSending}
          className={`${btn} text-indigo-700 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 inline-flex items-center gap-1.5`}
        >
          {slackSending ? (
            <>
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              发送中…
            </>
          ) : (
            <>💬 Slack 通知</>
          )}
        </button>
      </div>

      {toast && (
        <Toast
          toast={toast}
          onClose={() => setToast(null)}
          onRetry={toast.type === "error" ? notifySlack : undefined}
        />
      )}
    </>
  );
}

function Toast({
  toast,
  onClose,
  onRetry,
}: {
  toast: ToastState;
  onClose: () => void;
  onRetry?: () => void;
}) {
  const isErr = toast.type === "error";

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[90%]">
      <div
        className={`flex items-start gap-3 rounded-xl border-2 px-5 py-4 shadow-xl ${
          isErr
            ? "border-rose-300 bg-rose-50"
            : "border-emerald-300 bg-emerald-50"
        }`}
      >
        <div className="text-2xl">{isErr ? "❌" : "✅"}</div>
        <div className="flex-1">
          <div
            className={`font-semibold ${
              isErr ? "text-rose-900" : "text-emerald-900"
            }`}
          >
            {toast.message}
          </div>
          {toast.detail && (
            <div
              className={`mt-1 text-sm ${
                isErr ? "text-rose-700" : "text-emerald-700"
              }`}
            >
              {toast.detail}
            </div>
          )}
          {isErr && (
            <div className="mt-1 text-xs text-rose-600">
              详细错误已记录到浏览器控制台（F12 查看）
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
            >
              重试
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-2 py-1 text-xs font-medium ${
              isErr
                ? "text-rose-700 hover:bg-rose-100"
                : "text-emerald-700 hover:bg-emerald-100"
            }`}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
