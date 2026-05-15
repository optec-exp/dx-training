"use client";

import { useState, useEffect } from "react";

// 通用辅助：调用服务端 /api/records，用 service_role_key 查询（绕开 RLS）
async function fetchRecordsFromServer(ids?: string[], limit = 50) {
  const res = await fetch("/api/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, limit }),
  });
  const json = await res.json() as { records?: KintoneRecord[]; error?: string };
  if (!res.ok) throw new Error(json.error ?? "查询失败");
  return json.records ?? [];
}

// 同步结果的类型
type SyncResult = {
  success: boolean;
  total?: number;
  inserted?: number;
  updated?: number;
  failed?: number;
  insertedIds?: string[];
  updatedIds?: string[];
  failedIds?: string[];
  synced_at?: string;
  error?: string;
};

// Supabase 里的记录类型
type KintoneRecord = {
  id: number;
  kintone_id: string;
  case_number: string;
  customer_name: string;
  theme: string;
  status: string;
  mode: string;
  etd: string;
  eta: string;
  awb_no: string;
  synced_at: string;
};

// 分类弹窗的类型
type CategoryModal = {
  label: string;
  records: KintoneRecord[];
  failedIds?: string[];
  loading: boolean;
  error?: string;
};

export default function Home() {
  const [syncing, setSyncing]           = useState(false);
  const [result, setResult]             = useState<SyncResult | null>(null);
  const [records, setRecords]           = useState<KintoneRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [selected, setSelected]         = useState<KintoneRecord | null>(null);
  const [categoryModal, setCategoryModal] = useState<CategoryModal | null>(null);

  // ── 读取 Supabase 中已同步的记录（服务端接口，无 RLS 限制）──
  const loadRecords = async () => {
    setLoadingRecords(true);
    setRecordsError(null);
    try {
      const data = await fetchRecordsFromServer(undefined, 50);
      setRecords(data);
    } catch (err) {
      setRecords([]);
      setRecordsError(String(err));
    }
    setLoadingRecords(false);
  };

  // ── 页面打开时自动加载记录 ──────────────────────────────────
  useEffect(() => { loadRecords(); }, []);

  // ── 触发同步 ──────────────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true);
    setResult(null);

    const res  = await fetch("/api/sync", { method: "POST" });
    const data = await res.json() as SyncResult;
    setResult(data);
    setSyncing(false);

    // 同步完成后自动刷新列表
    if (data.success) loadRecords();
  };

  // ── 点击数字卡片，加载对应分类的案件 ──────────────────────
  const openCategory = async (
    label: string,
    type: "total" | "inserted" | "updated" | "failed"
  ) => {
    if (type === "failed") {
      setCategoryModal({ label, records: [], failedIds: result?.failedIds ?? [], loading: false });
      return;
    }

    // 先显示加载状态
    setCategoryModal({ label, records: [], loading: true });

    try {
      let ids: string[] | undefined;
      if (type === "inserted") ids = result?.insertedIds;
      else if (type === "updated") ids = result?.updatedIds;
      // total → ids 为空 → 服务端返回最新 200 条

      const data = await fetchRecordsFromServer(ids, 200);
      setCategoryModal({ label, records: data, loading: false });
    } catch (err) {
      setCategoryModal({ label, records: [], loading: false, error: String(err) });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-800">
              Kintone → Supabase 同步
            </h1>
            <p className="text-xs text-gray-400">差量更新 · 自动识别新增/变更</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadRecords}
              disabled={loadingRecords}
              className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40"
            >
              {loadingRecords ? "读取中..." : "查看已同步数据"}
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2"
            >
              {syncing && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {syncing ? "同步中..." : "立即同步"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-5">

        {/* 同步结果日志 */}
        {result && (
          <div className={`rounded-xl border px-5 py-4 ${
            result.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}>
            {result.success ? (
              <div className="space-y-3">
                <p className="text-sm font-bold text-green-700">同步完成</p>
                <div className="grid grid-cols-4 gap-3 text-center text-sm">
                  {[
                    { label: "总记录", value: result.total,    color: "text-gray-800",   type: "total"    as const },
                    { label: "新增",   value: result.inserted, color: "text-blue-600",   type: "inserted" as const },
                    { label: "更新",   value: result.updated,  color: "text-yellow-600", type: "updated"  as const },
                    { label: "失败",   value: result.failed,   color: "text-red-600",    type: "failed"   as const },
                  ].map((s) => {
                    const clickable = (s.value ?? 0) > 0;
                    return (
                      <div
                        key={s.label}
                        onClick={() => clickable && openCategory(s.label, s.type)}
                        className={`bg-white rounded-lg py-2 px-3 border border-green-100 transition-all select-none ${
                          clickable
                            ? "cursor-pointer hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5"
                            : "opacity-50"
                        }`}
                      >
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-400">{s.label}</p>
                        {clickable && (
                          <p className="text-xs text-blue-400 mt-0.5">点击查看 →</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400">同步时间：{result.synced_at}</p>
              </div>
            ) : (
              <p className="text-sm text-red-600">同步失败：{result.error}</p>
            )}
          </div>
        )}

        {/* 读取错误提示 */}
        {recordsError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            <p className="font-bold mb-1">读取记录失败</p>
            <p className="font-mono text-xs">{recordsError}</p>
          </div>
        )}

        {/* 已同步的记录列表 */}
        {records.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-700">已同步记录（最新50条）</p>
              <p className="text-xs text-gray-400">{records.length} 条</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    {["Kintone ID", "案件番号", "客户名", "状态", "Mode", "ETA", "AWB", "同步时间"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((r) => (
                    <tr key={r.id} onClick={() => setSelected(r)} className="hover:bg-blue-50 cursor-pointer">
                      <td className="px-4 py-2 text-gray-400">{r.kintone_id}</td>
                      <td className="px-4 py-2 font-medium text-gray-800">{r.case_number}</td>
                      <td className="px-4 py-2 text-gray-600">{r.customer_name}</td>
                      <td className="px-4 py-2 text-gray-600">{r.status}</td>
                      <td className="px-4 py-2 text-gray-600">{r.mode}</td>
                      <td className="px-4 py-2 text-gray-600">{r.eta}</td>
                      <td className="px-4 py-2 text-gray-600">{r.awb_no}</td>
                      <td className="px-4 py-2 text-gray-400 whitespace-nowrap">
                        {new Date(r.synced_at).toLocaleString("zh-CN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 初始提示 */}
        {!result && records.length === 0 && (
          <div className="text-center py-20 text-gray-400 text-sm">
            点击「立即同步」将 Kintone 数据同步到 Supabase
          </div>
        )}
      </main>

      {/* ── 分类案件弹窗（点击数字后显示） ────────────────────── */}
      {categoryModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={() => setCategoryModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col"
            style={{ maxHeight: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗标题 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">
                {categoryModal.label}
                {!categoryModal.loading && !categoryModal.failedIds && (
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    （{categoryModal.records.length} 条）
                  </span>
                )}
              </h2>
              <button
                onClick={() => setCategoryModal(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="overflow-y-auto flex-1 p-2">
              {categoryModal.loading ? (
                <div className="text-center py-12 text-gray-400 text-sm">加载中...</div>
              ) : categoryModal.error ? (
                <div className="p-4 bg-red-50 rounded-xl text-red-600 text-sm">
                  <p className="font-bold mb-1">查询失败</p>
                  <p className="font-mono text-xs">{categoryModal.error}</p>
                  <p className="mt-2 text-xs text-gray-400">请打开浏览器控制台（F12）查看详细日志</p>
                </div>
              ) : categoryModal.failedIds ? (
                /* 失败记录：只显示 ID */
                categoryModal.failedIds.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">无失败记录</div>
                ) : (
                  <ul className="space-y-1 p-2">
                    {categoryModal.failedIds.map((id) => (
                      <li key={id} className="bg-red-50 text-red-600 text-xs px-4 py-2 rounded-lg">
                        Kintone ID: {id}
                      </li>
                    ))}
                  </ul>
                )
              ) : categoryModal.records.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">无数据</div>
              ) : (
                /* 案件列表表格 */
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 sticky top-0">
                    <tr>
                      {["Kintone ID", "案件番号", "客户名", "状态", "Mode", "ETA", "AWB"].map((h) => (
                        <th key={h} className="px-4 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categoryModal.records.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => setSelected(r)}
                        className="hover:bg-blue-50 cursor-pointer"
                      >
                        <td className="px-4 py-2 text-gray-400">{r.kintone_id}</td>
                        <td className="px-4 py-2 font-medium text-gray-800">{r.case_number}</td>
                        <td className="px-4 py-2 text-gray-600">{r.customer_name}</td>
                        <td className="px-4 py-2 text-gray-600">{r.status}</td>
                        <td className="px-4 py-2 text-gray-600">{r.mode}</td>
                        <td className="px-4 py-2 text-gray-600">{r.eta}</td>
                        <td className="px-4 py-2 text-gray-600">{r.awb_no}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 单条案件详情弹窗 ──────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题 */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">
                {selected.case_number || "（案件番号なし）"}
              </h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            {/* 内容 */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Kintone ID",  value: selected.kintone_id },
                { label: "客户名",      value: selected.customer_name },
                { label: "案件主题",    value: selected.theme },
                { label: "状态",        value: selected.status },
                { label: "Mode",        value: selected.mode },
                { label: "ETD",         value: selected.etd },
                { label: "ETA",         value: selected.eta },
                { label: "AWB",         value: selected.awb_no },
                { label: "同步时间",    value: new Date(selected.synced_at).toLocaleString("zh-CN") },
              ].map((row) => (
                <div key={row.label} className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-400 mb-0.5">{row.label}</p>
                  <p className="text-gray-800 font-medium break-all">{row.value || "—"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
