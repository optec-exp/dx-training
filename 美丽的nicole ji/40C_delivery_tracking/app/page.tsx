"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---------- 类型定义 ----------
type AWB = {
  id: number;
  awb_number: string;
  origin: string;
  destination: string;
  eta: string;
  current_status: string;
  created_at: string;
};

type StatusLog = {
  id: number;
  awb_id: number;
  status: string;
  note: string | null;
  logged_at: string;
};

// ---------- 常量 ----------
const STATUS_OPTIONS = [
  { value: "pending",           label: "待处理" },
  { value: "picked_up",         label: "已揽收" },
  { value: "in_transit",        label: "运输中" },
  { value: "arrived",           label: "已到达" },
  { value: "out_for_delivery",  label: "派送中" },
  { value: "delivered",         label: "已交付" },
];

const STATUS_COLORS: Record<string, string> = {
  pending:           "bg-gray-100 text-gray-600",
  picked_up:         "bg-blue-100 text-blue-700",
  in_transit:        "bg-indigo-100 text-indigo-700",
  arrived:           "bg-purple-100 text-purple-700",
  out_for_delivery:  "bg-yellow-100 text-yellow-700",
  delivered:         "bg-green-100 text-green-700",
  delayed:           "bg-red-100 text-red-700",
};

const STATUS_DOTS: Record<string, string> = {
  pending:           "bg-gray-400",
  picked_up:         "bg-blue-500",
  in_transit:        "bg-indigo-500",
  arrived:           "bg-purple-500",
  out_for_delivery:  "bg-yellow-500",
  delivered:         "bg-green-500",
  delayed:           "bg-red-500",
};

function getLabel(value: string) {
  return STATUS_OPTIONS.find((s) => s.value === value)?.label ?? value;
}

// 延误判定：ETA 已过且未交付
function isDelayed(awb: AWB) {
  if (awb.current_status === "delivered") return false;
  return new Date() > new Date(awb.eta);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
export default function Home() {
  const [awbs, setAwbs] = useState<AWB[]>([]);
  const [selected, setSelected] = useState<AWB | null>(null);
  const [logs, setLogs] = useState<StatusLog[]>([]);
  const [filter, setFilter] = useState("all");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAwb, setNewAwb] = useState({
    awb_number: "",
    origin: "",
    destination: "",
    eta: "",
  });

  const [newStatus, setNewStatus] = useState("picked_up");
  const [newNote, setNewNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ---------- データ取得 ----------
  const fetchAwbs = async () => {
    const { data } = await supabase
      .from("awbs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAwbs(data);
  };

  const fetchLogs = async (awbId: number) => {
    const { data } = await supabase
      .from("status_logs")
      .select("*")
      .eq("awb_id", awbId)
      .order("logged_at", { ascending: true });
    if (data) setLogs(data);
  };

  useEffect(() => {
    fetchAwbs();
  }, []);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // ---------- 选择 AWB ----------
  const handleSelect = (awb: AWB) => {
    setSelected(awb);
    fetchLogs(awb.id);
    // 默认选下一个合理状态
    const idx = STATUS_OPTIONS.findIndex((s) => s.value === awb.current_status);
    const next = STATUS_OPTIONS[Math.min(idx + 1, STATUS_OPTIONS.length - 1)];
    setNewStatus(next.value);
    setNewNote("");
  };

  // ---------- 登记新 AWB ----------
  const handleAddAwb = async () => {
    if (!newAwb.awb_number.trim() || !newAwb.eta) {
      showMsg("请填写 AWB 单号和预定到达时间");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("awbs").insert({
      awb_number: newAwb.awb_number.trim(),
      origin: newAwb.origin.trim(),
      destination: newAwb.destination.trim(),
      eta: newAwb.eta,
      current_status: "pending",
    });
    if (error) {
      showMsg("登记失败：" + error.message);
    } else {
      showMsg("AWB 登记成功！");
      setNewAwb({ awb_number: "", origin: "", destination: "", eta: "" });
      setShowAddForm(false);
      fetchAwbs();
    }
    setLoading(false);
  };

  // ---------- 更新状态 ----------
  const handleUpdateStatus = async () => {
    if (!selected) return;
    setLoading(true);

    // 1. 写入状态历史
    const { error: logError } = await supabase.from("status_logs").insert({
      awb_id: selected.id,
      status: newStatus,
      note: newNote.trim() || null,
    });
    if (logError) {
      showMsg("更新失败：" + logError.message);
      setLoading(false);
      return;
    }

    // 2. 更新主表当前状态
    const { error: awbError } = await supabase
      .from("awbs")
      .update({ current_status: newStatus })
      .eq("id", selected.id);
    if (awbError) {
      showMsg("主表更新失败：" + awbError.message);
    } else {
      showMsg("状态更新成功！");
      setNewNote("");
      const updated = { ...selected, current_status: newStatus };
      setSelected(updated);
      await fetchAwbs();
      fetchLogs(selected.id);
      // 自动跳到下一个状态
      const idx = STATUS_OPTIONS.findIndex((s) => s.value === newStatus);
      const next = STATUS_OPTIONS[Math.min(idx + 1, STATUS_OPTIONS.length - 1)];
      setNewStatus(next.value);
    }
    setLoading(false);
  };

  // ---------- 过滤 ----------
  const filteredAwbs = awbs.filter((a) => {
    if (filter === "delayed") return isDelayed(a);
    if (filter === "all") return true;
    return a.current_status === filter;
  });

  const countOf = (key: string) => {
    if (key === "delayed") return awbs.filter(isDelayed).length;
    if (key === "all") return awbs.length;
    return awbs.filter((a) => a.current_status === key).length;
  };

  const FILTER_TABS = [
    { key: "all",      label: "全部" },
    { key: "pending",  label: "待处理" },
    { key: "in_transit", label: "运输中" },
    { key: "delivered",  label: "已交付" },
    { key: "delayed",    label: "延误" },
  ];

  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">配送追踪</h1>
            <p className="text-xs text-gray-400 mt-0.5">AWB 状态管理系统</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            ＋ 登记新 AWB
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* 提示消息 */}
        {message && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
            {message}
          </div>
        )}

        {/* 登记表单 */}
        {showAddForm && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-700 mb-4">登记新 AWB</h2>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="AWB 单号 *"
                value={newAwb.awb_number}
                onChange={(e) => setNewAwb({ ...newAwb, awb_number: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
              />
              <input
                type="text"
                placeholder="出发地"
                value={newAwb.origin}
                onChange={(e) => setNewAwb({ ...newAwb, origin: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="目的地"
                value={newAwb.destination}
                onChange={(e) => setNewAwb({ ...newAwb, destination: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">预定到达时间（ETA）*</label>
                <input
                  type="datetime-local"
                  value={newAwb.eta}
                  onChange={(e) => setNewAwb({ ...newAwb, eta: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAddAwb}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                登记
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-100"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* 左：AWB 列表 */}
          <div className="flex-1 min-w-0">
            {/* 过滤标签 */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    filter === tab.key
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                  <span className="ml-1 text-xs opacity-70">
                    ({countOf(tab.key)})
                  </span>
                </button>
              ))}
            </div>

            {/* AWB 列表 */}
            <div className="space-y-2">
              {filteredAwbs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">暂无数据</div>
              ) : (
                filteredAwbs.map((awb) => {
                  const delayed = isDelayed(awb);
                  const displayStatus = delayed ? "delayed" : awb.current_status;
                  return (
                    <div
                      key={awb.id}
                      onClick={() => handleSelect(awb)}
                      className={`bg-white border rounded-xl px-4 py-3 cursor-pointer hover:border-blue-300 transition-colors ${
                        selected?.id === awb.id
                          ? "border-blue-500 shadow-sm"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-800 font-mono">
                            {awb.awb_number}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {awb.origin} → {awb.destination}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            ETA：{formatDate(awb.eta)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[displayStatus] ?? STATUS_COLORS.pending}`}
                          >
                            {delayed ? "延误" : getLabel(awb.current_status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 右：详情 + 时间线 + 更新状态 */}
          {selected && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                {/* AWB 信息 */}
                <h2 className="font-bold text-gray-800 font-mono text-lg">
                  {selected.awb_number}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selected.origin} → {selected.destination}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  ETA：{formatDate(selected.eta)}
                </p>

                {/* 延误警告 */}
                {isDelayed(selected) && (
                  <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    已超过预定到达时间，货物延误
                  </div>
                )}

                {/* 更新状态 */}
                {selected.current_status !== "delivered" && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                      更新状态
                    </h3>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
                    >
                      {STATUS_OPTIONS.filter((s) => s.value !== "pending").map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="备注（可选）"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleUpdateStatus()}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
                    />
                    <button
                      onClick={handleUpdateStatus}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      确认更新
                    </button>
                  </div>
                )}

                {selected.current_status === "delivered" && (
                  <div className="mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                    货物已成功交付
                  </div>
                )}

                {/* 时间线 */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">
                    状态时间线
                  </h3>
                  {logs.length === 0 ? (
                    <p className="text-xs text-gray-400">暂无状态记录</p>
                  ) : (
                    <div className="relative">
                      {/* 竖线 */}
                      <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" />
                      <div className="space-y-4">
                        {logs.map((log, idx) => (
                          <div key={log.id} className="flex gap-3 relative">
                            {/* 圆点 */}
                            <div
                              className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 border-2 border-white shadow-sm z-10 ${
                                STATUS_DOTS[log.status] ?? "bg-gray-400"
                              } ${idx === logs.length - 1 ? "ring-2 ring-offset-1 ring-blue-300" : ""}`}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                {getLabel(log.status)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(log.logged_at)}
                              </p>
                              {log.note && (
                                <p className="text-xs text-gray-500 mt-0.5 bg-gray-50 rounded px-2 py-1">
                                  {log.note}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
