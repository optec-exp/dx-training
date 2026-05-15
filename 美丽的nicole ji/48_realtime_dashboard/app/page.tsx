"use client";

import { useState, useEffect, useRef } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type KintoneRecord = {
  id: number;
  kintone_id: string;
  case_number: string;
  customer_name: string;
  status: string;
  mode: string;
  eta: string;
  awb_no: string;
  synced_at: string;
};

type ChangeEvent = {
  id: string;
  type: "INSERT" | "UPDATE" | "DELETE";
  record: Partial<KintoneRecord>;
  timestamp: string;
};

type ConnStatus = "connecting" | "connected" | "disconnected";

export default function Home() {
  const [connStatus, setConnStatus] = useState<ConnStatus>("connecting");
  const [events, setEvents]         = useState<ChangeEvent[]>([]);
  const [records, setRecords]       = useState<KintoneRecord[]>([]);
  const channelRef                  = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    loadRecords();
    setupRealtime();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 初始加载最新20条 ──────────────────────────────────────
  const loadRecords = async () => {
    const { data } = await supabase
      .from("kintone_records")
      .select("*")
      .order("synced_at", { ascending: false })
      .limit(20);
    setRecords(data ?? []);
  };

  // ── Supabase Realtime 订阅 ────────────────────────────────
  const setupRealtime = () => {
    const channel = supabase
      .channel("kintone_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kintone_records" },
        async (payload) => {
          // 追加事件到流
          const event: ChangeEvent = {
            id: `${Date.now()}-${Math.random()}`,
            type: payload.eventType as ChangeEvent["type"],
            record: (payload.new ?? payload.old) as Partial<KintoneRecord>,
            timestamp: new Date().toISOString(),
          };
          setEvents((prev) => [event, ...prev].slice(0, 100));

          // 刷新数据表
          loadRecords();

          // INSERT 时：发送 Slack 通知 + 写入知识库
          if (payload.eventType === "INSERT") {
            await Promise.all([
              fetch("/api/slack", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ record: payload.new }),
              }),
              fetch("/api/write-knowledge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ record: payload.new }),
              }),
            ]);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED")    setConnStatus("connected");
        else if (status === "CLOSED" || status === "CHANNEL_ERROR")
                                        setConnStatus("disconnected");
        else                            setConnStatus("connecting");
      });

    channelRef.current = channel;
  };

  const statusColor = {
    connected:    "bg-green-400",
    connecting:   "bg-yellow-400",
    disconnected: "bg-red-400",
  };
  const statusText = {
    connected:    "Connected",
    connecting:   "Connecting...",
    disconnected: "Disconnected",
  };
  const statusTextColor = {
    connected:    "text-green-400",
    connecting:   "text-yellow-400",
    disconnected: "text-red-400",
  };
  const eventColor = {
    INSERT: { bg: "bg-blue-950 border-blue-800",   badge: "bg-blue-600" },
    UPDATE: { bg: "bg-yellow-950 border-yellow-800", badge: "bg-yellow-600" },
    DELETE: { bg: "bg-red-950 border-red-800",     badge: "bg-red-600" },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-wide">実時通知仪表盘</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Supabase Realtime · kintone_records
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${statusColor[connStatus]} ${connStatus !== "disconnected" ? "animate-pulse" : ""}`} />
            <span className={`text-xs font-semibold ${statusTextColor[connStatus]}`}>
              {statusText[connStatus]}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-6 flex gap-5" style={{ height: "calc(100vh - 73px)" }}>

        {/* 左：实时事件流 */}
        <div className="w-72 flex-shrink-0 bg-gray-900 rounded-2xl border border-gray-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <p className="text-sm font-bold">实时事件流</p>
            <span className="text-xs text-gray-500">{events.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {events.length === 0 ? (
              <p className="text-center py-10 text-gray-600 text-xs">等待数据变更…</p>
            ) : (
              events.map((e) => (
                <div
                  key={e.id}
                  className={`rounded-lg px-3 py-2 text-xs border ${eventColor[e.type].bg}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`${eventColor[e.type].badge} text-white text-xs font-bold px-1.5 py-0.5 rounded`}>
                      {e.type}
                    </span>
                    <span className="text-gray-500">
                      {new Date(e.timestamp).toLocaleTimeString("zh-CN")}
                    </span>
                  </div>
                  <p className="text-gray-200 truncate font-medium">
                    {e.record.case_number || e.record.kintone_id || "—"}
                  </p>
                  {e.record.customer_name && (
                    <p className="text-gray-500 truncate">{e.record.customer_name}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右：数据表（实时刷新） */}
        <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-800 flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <p className="text-sm font-bold">最新记录（实时）</p>
            <span className="text-xs text-gray-500">{records.length} 条</span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-800 text-gray-400 sticky top-0">
                <tr>
                  {["案件番号", "客户名", "状态", "Mode", "ETA", "AWB", "同步时间"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-600">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-800/60 transition-colors">
                      <td className="px-4 py-2 font-medium text-gray-200">{r.case_number}</td>
                      <td className="px-4 py-2 text-gray-400">{r.customer_name}</td>
                      <td className="px-4 py-2 text-gray-400">{r.status}</td>
                      <td className="px-4 py-2 text-gray-400">{r.mode}</td>
                      <td className="px-4 py-2 text-gray-400">{r.eta}</td>
                      <td className="px-4 py-2 text-gray-400">{r.awb_no}</td>
                      <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                        {new Date(r.synced_at).toLocaleString("zh-CN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
