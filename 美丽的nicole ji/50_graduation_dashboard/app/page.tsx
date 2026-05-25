"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createClient, User } from "@supabase/supabase-js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell,
  LineChart, Line,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

// ─── Supabase 客户端 ─────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── 类型定义 ────────────────────────────────────────────────
type CaseRecord = {
  id: number;
  kintone_id: string;
  case_number: string;
  customer_name: string;
  theme: string;
  status: string;
  mode: string;
  service_type: string;
  transport_mode: string;
  business_scope: string;
  export_team: string;
  import_team: string;
  etd: string | null;
  eta: string | null;
  awb_no: string;
  notes: string;
  latest_tracking_date: string | null;
  synced_at: string;
  created_at: string;
};

type Analysis = {
  id: number;
  risk_level: "高" | "中" | "低";
  risk_score: number;
  delay_prediction: string;
  priority_rank: number;
  priority_action: string;
  bottleneck: string;
  reason: string;
};

type SyncLog = {
  id: number;
  event_type: string;
  summary: string;
  detail: Record<string, unknown>;
  created_at: string;
};

type RealtimeEvent = {
  id: string;
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, unknown>;
  timestamp: string;
};

type TabId = "dashboard" | "cases" | "analysis" | "events" | "admin";

// ─── 颜色常量 ────────────────────────────────────────────────
const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899"];

function riskColor(level: string) {
  if (level === "高") return "#EF4444";
  if (level === "中") return "#F59E0B";
  return "#10B981";
}

function statusColor(s: string) {
  if (s.includes("処理中") || s.includes("进行中") || s.includes("pending")) return "#F59E0B";
  if (s.includes("完了") || s.includes("完成") || s.includes("delivered")) return "#10B981";
  if (s.includes("確認") || s.includes("确认")) return "#3B82F6";
  if (s.includes("キャンセル") || s.includes("取消") || s.includes("delayed")) return "#EF4444";
  if (s.includes("customs") || s.includes("海关")) return "#8B5CF6";
  return "#6B7280";
}

// ══════════════════════════════════════════════════════════════
// 主页面组件
// ══════════════════════════════════════════════════════════════
export default function Home() {
  // ─── 认证状态 ──────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMsg, setAuthMsg] = useState("");

  // ─── 数据状态 ──────────────────────────────────────────────
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [connStatus, setConnStatus] = useState<string>("disconnected");

  // ─── UI 状态 ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [syncResult, setSyncResult] = useState<string>("");
  const [analyzeResult, setAnalyzeResult] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("全部");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [detailId, setDetailId] = useState<number | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ══════════════════════════════════════════════════════════
  // 认证逻辑
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    setAuthMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthMsg("登录失败：" + error.message);
  };

  const handleRegister = async () => {
    setAuthMsg("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setAuthMsg("注册失败：" + error.message);
    else setAuthMsg("注册成功！已自动登录");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ══════════════════════════════════════════════════════════
  // 数据加载
  // ══════════════════════════════════════════════════════════
  const loadCases = useCallback(async () => {
    const { data } = await supabase
      .from("cases")
      .select("*")
      .order("synced_at", { ascending: false })
      .limit(2000);
    if (data) setCases(data);
  }, []);

  const loadAnalyses = useCallback(async () => {
    const { data } = await supabase
      .from("ai_analyses")
      .select("*")
      .order("priority_rank", { ascending: true });
    if (data) setAnalyses(data as unknown as Analysis[]);
  }, []);

  const loadLogs = useCallback(async () => {
    const { data } = await supabase
      .from("sync_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setSyncLogs(data);
  }, []);

  // 登录后加载数据
  useEffect(() => {
    if (!user) return;
    loadCases();
    loadAnalyses();
    loadLogs();
  }, [user, loadCases, loadAnalyses, loadLogs]);

  // ══════════════════════════════════════════════════════════
  // Supabase Realtime 订阅
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("dashboard_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cases" }, (payload) => {
        const evt: RealtimeEvent = {
          id: `${Date.now()}-${Math.random()}`,
          type: payload.eventType as RealtimeEvent["type"],
          table: "cases",
          record: (payload.new ?? payload.old) as Record<string, unknown>,
          timestamp: new Date().toISOString(),
        };
        setEvents((prev) => [evt, ...prev].slice(0, 100));
        loadCases();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ai_analyses" }, (payload) => {
        const evt: RealtimeEvent = {
          id: `${Date.now()}-${Math.random()}`,
          type: payload.eventType as RealtimeEvent["type"],
          table: "ai_analyses",
          record: (payload.new ?? payload.old) as Record<string, unknown>,
          timestamp: new Date().toISOString(),
        };
        setEvents((prev) => [evt, ...prev].slice(0, 100));
        loadAnalyses();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sync_logs" }, (payload) => {
        const evt: RealtimeEvent = {
          id: `${Date.now()}-${Math.random()}`,
          type: "INSERT",
          table: "sync_logs",
          record: payload.new as Record<string, unknown>,
          timestamp: new Date().toISOString(),
        };
        setEvents((prev) => [evt, ...prev].slice(0, 100));
        loadLogs();
      })
      .subscribe((status) => {
        setConnStatus(status === "SUBSCRIBED" ? "connected" : status);
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadCases, loadAnalyses, loadLogs]);

  // ══════════════════════════════════════════════════════════
  // 操作函数
  // ══════════════════════════════════════════════════════════
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult("");
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncResult(`同步完成！共${data.total}条, 新增${data.inserted}, 更新${data.updated}, 失败${data.failed}`);
        loadCases();
        loadLogs();
      } else {
        setSyncResult("同步失败: " + (data.error || "未知错误"));
      }
    } catch (err) {
      setSyncResult("同步异常: " + String(err));
    }
    setSyncing(false);
  };

  const handleAnalyze = async () => {
    const targetCases = selectedIds.size > 0
      ? cases.filter((c) => selectedIds.has(c.id))
      : cases;
    if (targetCases.length === 0) {
      setAnalyzeResult("请先选择案件或同步数据");
      return;
    }
    setAnalyzing(true);
    setAnalyzeResult("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cases: targetCases }),
      });
      const data = await res.json();
      if (data.analyses) {
        setAnalyses(data.analyses);
        const high = data.analyses.filter((a: Analysis) => a.risk_level === "高").length;
        const mid  = data.analyses.filter((a: Analysis) => a.risk_level === "中").length;
        const slackCount = Object.keys(data.slack_sent || {}).length;
        setAnalyzeResult(`分析完成！${data.analyses.length}件, 高风险${high}件, 中风险${mid}件${slackCount > 0 ? `, 已发送${slackCount}条Slack通知` : ""}`);
        loadAnalyses();
      } else {
        setAnalyzeResult("分析失败: " + (data.error || "未知错误"));
      }
    } catch (err) {
      setAnalyzeResult("分析异常: " + String(err));
    }
    setAnalyzing(false);
  };

  // ══════════════════════════════════════════════════════════
  // 计算统计数据（图表用）
  // ══════════════════════════════════════════════════════════
  const stats = useMemo(() => {
    // 按状态分布
    const statusMap = new Map<string, number>();
    cases.forEach((c) => {
      const s = c.status || "未知";
      statusMap.set(s, (statusMap.get(s) || 0) + 1);
    });
    const statusData = Array.from(statusMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 三大类分布
    const buildPieData = (key: keyof CaseRecord) => {
      const map = new Map<string, number>();
      cases.forEach((c) => {
        const v = (c[key] as string) || "未设定";
        map.set(v, (map.get(v) || 0) + 1);
      });
      return Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    };
    const serviceTypeData = buildPieData("service_type");
    const transportModeData = buildPieData("transport_mode");
    const businessScopeData = buildPieData("business_scope");

    // 按月趋势（基于 ETA）
    const monthMap = new Map<string, number>();
    cases.forEach((c) => {
      if (c.eta) {
        const month = c.eta.slice(0, 7); // YYYY-MM
        monthMap.set(month, (monthMap.get(month) || 0) + 1);
      }
    });
    const trendData = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month, count }));

    // 高风险计数
    const highRisk = analyses.filter((a) => a.risk_level === "高").length;
    const midRisk  = analyses.filter((a) => a.risk_level === "中").length;

    // 今日到达
    const today = new Date().toISOString().slice(0, 10);
    const todayEta = cases.filter((c) => c.eta === today).length;

    return { statusData, serviceTypeData, transportModeData, businessScopeData, trendData, highRisk, midRisk, todayEta };
  }, [cases, analyses]);

  // ─── 案件列表筛选 ─────────────────────────────────────────
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.case_number.toLowerCase().includes(q) ||
          c.customer_name.toLowerCase().includes(q) ||
          c.awb_no.toLowerCase().includes(q) ||
          c.theme.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [cases, statusFilter, search]);

  // ─── 分析结果筛选 ─────────────────────────────────────────
  const filteredAnalyses = useMemo(() => {
    if (riskFilter === "全部") return analyses;
    return analyses.filter((a) => a.risk_level === riskFilter);
  }, [analyses, riskFilter]);

  // ─── 获取所有状态选项 ─────────────────────────────────────
  const statusOptions = useMemo(() => {
    const set = new Set(cases.map((c) => c.status).filter(Boolean));
    return Array.from(set).sort();
  }, [cases]);

  // ══════════════════════════════════════════════════════════
  // 渲染：加载中
  // ══════════════════════════════════════════════════════════
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // 渲染：未登录 → 登录/注册
  // ══════════════════════════════════════════════════════════
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
            综合案件管理仪表盘
          </h1>
          <p className="text-center text-gray-500 mb-6 text-sm">毕业项目 - C业务</p>

          {/* 切换登录/注册 */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setAuthMode("login"); setAuthMsg(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                authMode === "login" ? "bg-white shadow text-blue-600" : "text-gray-500"
              }`}
            >
              登录
            </button>
            <button
              onClick={() => { setAuthMode("register"); setAuthMsg(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                authMode === "register" ? "bg-white shadow text-blue-600" : "text-gray-500"
              }`}
            >
              注册
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              placeholder="密码（至少6位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (authMode === "login" ? handleLogin() : handleRegister())}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={authMode === "login" ? handleLogin : handleRegister}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              {authMode === "login" ? "登录" : "注册"}
            </button>
          </div>

          {authMsg && (
            <p className={`mt-4 text-sm text-center ${authMsg.includes("失败") ? "text-red-500" : "text-green-600"}`}>
              {authMsg}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // 渲染：已登录 → 仪表盘
  // ══════════════════════════════════════════════════════════
  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: "dashboard", label: "仪表盘",   icon: "\u{1f4ca}" },
    { id: "cases",     label: "案件列表", icon: "\u{1f4cb}" },
    { id: "analysis",  label: "AI分析",   icon: "\u{1f916}" },
    { id: "events",    label: "事件流",   icon: "\u26a1" },
    { id: "admin",     label: "管理",     icon: "\u2699\ufe0f" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Header ──────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-800">综合案件管理仪表盘</h1>
          <span className={`inline-block w-2 h-2 rounded-full ${
            connStatus === "connected" ? "bg-green-500" : "bg-gray-300"
          }`} title={`Realtime: ${connStatus}`} />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500 transition"
          >
            登出
          </button>
        </div>
      </header>

      {/* ─── Tab Bar ─────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content ─────────────────────────────── */}
      <main className="p-6 max-w-7xl mx-auto">

        {/* ═══ Tab 1: 仪表盘概览 ═══ */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* 派送日历 */}
            <DeliveryCalendar
              cases={cases}
              calMonth={calMonth}
              setCalMonth={setCalMonth}
            />

            {/* KPI 卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label="总案件数" value={cases.length} color="#3B82F6" />
              <KpiCard label="高风险案件" value={stats.highRisk} color="#EF4444" />
              <KpiCard label="中风险案件" value={stats.midRisk} color="#F59E0B" />
              <KpiCard label="今日到达" value={stats.todayEta} color="#10B981" />
            </div>

            {/* 图表区 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 按状态分布 - 柱状图 */}
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">案件状态分布</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="件数" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 三大类分布 - 3个饼图纵向排列 */}
              <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">运输分类分布</h3>
                {[
                  { title: "服务类型 (Service Type)", data: stats.serviceTypeData },
                  { title: "Mode (Import/Export)", data: stats.transportModeData },
                  { title: "Business Scope", data: stats.businessScopeData },
                ].map(({ title, data }) => (
                  <div key={title}>
                    <p className="text-xs font-semibold text-gray-500 mb-1">{title}</p>
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width="45%" height={120}>
                        <PieChart>
                          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={45} innerRadius={20}>
                            {data.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-1 text-xs">
                        {data.map((d, i) => (
                          <div key={d.name} className="flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-gray-600">{d.name}</span>
                            <span className="text-gray-400 ml-auto">{d.value}件</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ETA 月度趋势 - 折线图 */}
              <div className="bg-white rounded-xl shadow-sm p-5 md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">ETA 月度趋势</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={stats.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} name="案件数" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* ═══ Tab 2: 案件列表 ═══ */}
        {activeTab === "cases" && (
          <div className="space-y-4">
            {/* 搜索和筛选 */}
            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="text"
                placeholder="搜索案件番号 / 客户名 / AWB..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">全部状态</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500">
                共 {filteredCases.length} 条
              </span>
            </div>

            {/* 选中操作栏 */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2">
                <span className="text-sm font-medium text-indigo-700">
                  已选 {selectedIds.size} 件
                </span>
                <button
                  onClick={() => {
                    setActiveTab("analysis");
                    handleAnalyze();
                  }}
                  disabled={analyzing}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {analyzing ? "分析中..." : "分析选中案件"}
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-sm text-gray-500 hover:text-red-500 transition"
                >
                  清除选择
                </button>
              </div>
            )}

            {/* 案件表格 */}
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={filteredCases.length > 0 && filteredCases.slice(0, 100).every((c) => selectedIds.has(c.id))}
                        onChange={(e) => {
                          const newSet = new Set(selectedIds);
                          filteredCases.slice(0, 100).forEach((c) => {
                            if (e.target.checked) newSet.add(c.id);
                            else newSet.delete(c.id);
                          });
                          setSelectedIds(newSet);
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">案件番号</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">客户</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">主题</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">状态</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Mode</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">ETA</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">AWB</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.slice(0, 100).map((c, i) => (
                    <tr
                      key={c.id}
                      className={`border-b border-gray-100 hover:bg-blue-50 transition cursor-pointer ${
                        selectedIds.has(c.id) ? "bg-indigo-50/50" : i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                      onClick={() => {
                        const newSet = new Set(selectedIds);
                        if (newSet.has(c.id)) newSet.delete(c.id);
                        else newSet.add(c.id);
                        setSelectedIds(newSet);
                      }}
                    >
                      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(c.id)}
                          onChange={() => {
                            const newSet = new Set(selectedIds);
                            if (newSet.has(c.id)) newSet.delete(c.id);
                            else newSet.add(c.id);
                            setSelectedIds(newSet);
                          }}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{c.case_number}</td>
                      <td className="px-4 py-3">{c.customer_name}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate">{c.theme}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: statusColor(c.status) + "20",
                            color: statusColor(c.status),
                          }}
                        >
                          {c.status || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          c.mode === "Export" ? "bg-blue-50 text-blue-600" :
                          c.mode === "Import" ? "bg-green-50 text-green-600" :
                          "bg-gray-50 text-gray-600"
                        }`}>
                          {c.mode || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{c.eta || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{c.awb_no || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCases.length === 0 && (
                <div className="text-center py-12 text-gray-400">暂无案件数据，请先在「管理」中同步</div>
              )}
            </div>
          </div>
        )}

        {/* ═══ Tab 3: AI 分析 ═══ */}
        {activeTab === "analysis" && (
          <div className="space-y-6">
            {/* 操作区 */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleAnalyze}
                disabled={analyzing || cases.length === 0}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? "分析中..." : selectedIds.size > 0 ? `分析选中案件 (${selectedIds.size}件)` : `分析全部案件 (${cases.length}件)`}
              </button>
              {selectedIds.size > 0 && (
                <span className="text-xs text-gray-400">
                  已选 {selectedIds.size} 件 | 去「案件列表」可选择/取消
                </span>
              )}
              {analyzeResult && (
                <span className={`text-sm ${analyzeResult.includes("失败") || analyzeResult.includes("异常") ? "text-red-500" : "text-green-600"}`}>
                  {analyzeResult}
                </span>
              )}
            </div>

            {/* 风险统计卡片 */}
            {analyses.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  {(["高", "中", "低"] as const).map((level) => {
                    const count = analyses.filter((a) => a.risk_level === level).length;
                    const isActive = riskFilter === level;
                    return (
                      <button
                        key={level}
                        onClick={() => setRiskFilter(riskFilter === level ? "全部" : level)}
                        className={`p-4 rounded-xl text-center transition cursor-pointer border-2 ${
                          isActive ? "ring-2 ring-offset-2" : ""
                        }`}
                        style={{
                          borderColor: riskColor(level),
                          backgroundColor: riskColor(level) + "10",
                          ...(isActive ? { ringColor: riskColor(level) } : {}),
                        }}
                      >
                        <div className="text-3xl font-bold" style={{ color: riskColor(level) }}>{count}</div>
                        <div className="text-sm font-medium text-gray-600">{level}风险</div>
                      </button>
                    );
                  })}
                </div>

                {/* 分析结果列表 */}
                <div className="space-y-3">
                  {filteredAnalyses.map((a) => {
                    const c = cases.find((cc) => cc.id === a.id);
                    const isOpen = detailId === a.id;
                    return (
                      <div
                        key={a.id}
                        className="bg-white rounded-xl shadow-sm border-l-4 cursor-pointer hover:shadow-md transition"
                        style={{ borderLeftColor: riskColor(a.risk_level) }}
                        onClick={() => setDetailId(isOpen ? null : a.id)}
                      >
                        {/* 摘要行 */}
                        <div className="flex items-start justify-between p-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="inline-block px-2 py-0.5 rounded text-xs font-bold text-white"
                                style={{ backgroundColor: riskColor(a.risk_level) }}
                              >
                                {a.risk_level}风险
                              </span>
                              <span className="text-xs text-gray-400">
                                优先级 #{a.priority_rank}
                              </span>
                              <span className="font-mono text-sm font-semibold text-gray-700">
                                {c?.case_number || `#${a.id}`}
                              </span>
                              <span className="text-sm text-gray-500">
                                {c?.customer_name}
                              </span>
                              <span className="text-xs text-gray-300 ml-auto">
                                {isOpen ? "收起" : "点击展开"}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">延迟预测：</span>{a.delay_prediction}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold" style={{ color: riskColor(a.risk_level) }}>
                              {(a.risk_score * 100).toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-400">风险分</div>
                          </div>
                        </div>

                        {/* 展开详情 */}
                        {isOpen && (
                          <div className="border-t border-gray-100 p-4 bg-gray-50/50 rounded-b-xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* 左侧：AI 分析结果 */}
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2">AI 分析结果</h4>
                                <div className="text-sm"><span className="font-medium text-gray-500">风险等级：</span><span className="font-bold" style={{ color: riskColor(a.risk_level) }}>{a.risk_level}风险 ({(a.risk_score * 100).toFixed(0)}分)</span></div>
                                <div className="text-sm"><span className="font-medium text-gray-500">延迟预测：</span>{a.delay_prediction}</div>
                                <div className="text-sm"><span className="font-medium text-gray-500">当前瓶颈：</span>{a.bottleneck}</div>
                                <div className="text-sm"><span className="font-medium text-gray-500">建议操作：</span><span className="text-blue-600 font-medium">{a.priority_action}</span></div>
                                <div className="text-sm"><span className="font-medium text-gray-500">判断理由：</span>{a.reason}</div>
                              </div>

                              {/* 右侧：案件原始信息 */}
                              {c && (
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">案件详情</h4>
                                  <div className="text-sm"><span className="font-medium text-gray-500">案件番号：</span><span className="font-mono">{c.case_number}</span></div>
                                  <div className="text-sm"><span className="font-medium text-gray-500">客户名称：</span>{c.customer_name}</div>
                                  <div className="text-sm"><span className="font-medium text-gray-500">案件主题：</span>{c.theme || "—"}</div>
                                  <div className="text-sm"><span className="font-medium text-gray-500">状态：</span><span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: statusColor(c.status) + "20", color: statusColor(c.status) }}>{c.status || "—"}</span></div>
                                  <div className="text-sm"><span className="font-medium text-gray-500">运输模式：</span>{c.mode || "—"}</div>
                                  <div className="text-sm"><span className="font-medium text-gray-500">ETD：</span>{c.etd || "—"}</div>
                                  <div className="text-sm"><span className="font-medium text-gray-500">ETA：</span>{c.eta || "—"}</div>
                                  <div className="text-sm"><span className="font-medium text-gray-500">AWB：</span><span className="font-mono">{c.awb_no || "—"}</span></div>
                                  {c.notes && <div className="text-sm"><span className="font-medium text-gray-500">备注：</span>{c.notes}</div>}
                                  <div className="text-xs text-gray-400 mt-2">同步时间：{new Date(c.synced_at).toLocaleString("zh-CN")}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {analyses.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                点击上方按钮进行 AI 风险分析
              </div>
            )}
          </div>
        )}

        {/* ═══ Tab 4: 实时事件流 ═══ */}
        {activeTab === "events" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`inline-block w-3 h-3 rounded-full ${
                connStatus === "connected" ? "bg-green-500 animate-pulse" : "bg-gray-300"
              }`} />
              <span className="text-sm text-gray-600">
                Realtime: {connStatus === "connected" ? "已连接" : connStatus}
              </span>
              <span className="text-sm text-gray-400">
                共 {events.length} 条事件
              </span>
            </div>

            <div className="space-y-2">
              {events.length === 0 && (
                <div className="text-center py-16 text-gray-400">等待实时事件...</div>
              )}
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className={`bg-white rounded-lg shadow-sm p-3 border-l-4 ${
                    evt.type === "INSERT" ? "border-l-blue-500" :
                    evt.type === "UPDATE" ? "border-l-yellow-500" :
                    "border-l-red-500"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`font-bold ${
                      evt.type === "INSERT" ? "text-blue-600" :
                      evt.type === "UPDATE" ? "text-yellow-600" :
                      "text-red-600"
                    }`}>
                      {evt.type}
                    </span>
                    <span className="text-gray-400">{evt.table}</span>
                    <span className="text-gray-300 ml-auto">
                      {new Date(evt.timestamp).toLocaleTimeString("zh-CN")}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1 truncate">
                    {evt.table === "cases" && (
                      <>{(evt.record as CaseRecord).case_number} - {(evt.record as CaseRecord).customer_name}</>
                    )}
                    {evt.table === "sync_logs" && (
                      <>{(evt.record as SyncLog).summary}</>
                    )}
                    {evt.table === "ai_analyses" && (
                      <>案件 #{(evt.record as { case_id?: number }).case_id} 分析结果更新</>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ Tab 5: 系统管理 ═══ */}
        {activeTab === "admin" && (
          <div className="space-y-6">
            {/* Kintone 同步 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Kintone 数据同步</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {syncing ? "同步中..." : "手动同步"}
                </button>
                {syncResult && (
                  <span className={`text-sm ${syncResult.includes("失败") || syncResult.includes("异常") ? "text-red-500" : "text-green-600"}`}>
                    {syncResult}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                自动同步：每6小时（Vercel Cron）| 数据源：Kintone App {process.env.NEXT_PUBLIC_KINTONE_APP_ID || ""}
              </p>
            </div>

            {/* 同步日志 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">操作日志</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {syncLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 text-sm border-b border-gray-50 pb-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold text-white ${
                      log.event_type === "SYNC" ? "bg-blue-500" :
                      log.event_type === "AI_ANALYZE" ? "bg-indigo-500" :
                      "bg-gray-500"
                    }`}>
                      {log.event_type}
                    </span>
                    <span className="text-gray-600 flex-1">{log.summary}</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(log.created_at).toLocaleString("zh-CN")}
                    </span>
                  </div>
                ))}
                {syncLogs.length === 0 && (
                  <div className="text-center py-8 text-gray-400">暂无日志</div>
                )}
              </div>
            </div>

            {/* 系统信息 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">系统信息</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">案件总数：</span><span className="font-semibold">{cases.length}</span></div>
                <div><span className="text-gray-500">AI分析数：</span><span className="font-semibold">{analyses.length}</span></div>
                <div><span className="text-gray-500">Realtime：</span><span className="font-semibold">{connStatus}</span></div>
                <div><span className="text-gray-500">当前用户：</span><span className="font-semibold">{user.email}</span></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── KPI 卡片组件 ────────────────────────────────────────────
function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm p-5 border-t-4"
      style={{ borderTopColor: color }}
    >
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

// ─── 派送日历组件 ─────────────────────────────────────────────
function DeliveryCalendar({
  cases,
  calMonth,
  setCalMonth,
}: {
  cases: CaseRecord[];
  calMonth: string;
  setCalMonth: (m: string) => void;
}) {
  const [year, month] = calMonth.split("-").map(Number);
  const today = new Date().toISOString().slice(0, 10);

  // ─── 筛选状态 ───
  const [filterExport, setFilterExport] = useState("");
  const [filterImport, setFilterImport] = useState("");
  const [filterService, setFilterService] = useState("");

  // 从数据中提取去重选项
  const exportTeams = useMemo(() => [...new Set(cases.map(c => c.export_team).filter(Boolean))].sort(), [cases]);
  const importTeams = useMemo(() => [...new Set(cases.map(c => c.import_team).filter(Boolean))].sort(), [cases]);
  const serviceTypes = useMemo(() => [...new Set(cases.map(c => c.service_type).filter(Boolean))].sort(), [cases]);

  // 筛选后的案件
  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (filterExport && c.export_team !== filterExport) return false;
      if (filterImport && c.import_team !== filterImport) return false;
      if (filterService && c.service_type !== filterService) return false;
      return true;
    });
  }, [cases, filterExport, filterImport, filterService]);

  // 按货物追踪首行日期分组（fallback 到 ETA）
  const etaMap = useMemo(() => {
    const map = new Map<string, CaseRecord[]>();
    filtered.forEach((c) => {
      const raw = c.latest_tracking_date || c.eta;
      if (raw) {
        const dateStr = raw.slice(0, 10);
        const arr = map.get(dateStr) || [];
        arr.push(c);
        map.set(dateStr, arr);
      }
    });
    return map;
  }, [filtered]);

  // 生成日历网格
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=周日
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // 切换月份
  const changeMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setCalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  // 展开某天的案件列表
  const [expandDay, setExpandDay] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      {/* 日历头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-gray-700">派送日历 (货物追踪)</h3>
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-100 border border-green-300" />1件</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-300" />2~4件</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-100 border border-orange-300" />5~9件</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-300" />10件+</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded transition">&lt;</button>
          <span className="text-sm font-semibold text-gray-700 w-24 text-center">{year}年{month}月</span>
          <button onClick={() => changeMonth(1)} className="px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded transition">&gt;</button>
          <button
            onClick={() => {
              const now = new Date();
              setCalMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
            }}
            className="ml-2 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
          >
            今天
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={filterExport}
          onChange={(e) => setFilterExport(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          <option value="">輸出チーム: 全部</option>
          {exportTeams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterImport}
          onChange={(e) => setFilterImport(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          <option value="">輸入チーム: 全部</option>
          {importTeams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          <option value="">服务类型: 全部</option>
          {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(filterExport || filterImport || filterService) && (
          <button
            onClick={() => { setFilterExport(""); setFilterImport(""); setFilterService(""); }}
            className="text-xs text-red-500 hover:text-red-700 underline"
          >
            清除筛选
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          本月: {Array.from(etaMap.entries()).filter(([d]) => d.startsWith(calMonth)).reduce((s, [, arr]) => s + arr.length, 0)}件
        </span>
      </div>

      {/* 星期行 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((w) => (
          <div key={w} className={`text-center text-xs font-semibold py-1 ${w === "日" || w === "六" ? "text-red-400" : "text-gray-400"}`}>
            {w}
          </div>
        ))}
      </div>

      {/* 日期格子 */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayCases = etaMap.get(dateStr) || [];
          const count = dayCases.length;
          const isToday = dateStr === today;
          const isExpanded = expandDay === dateStr;

          return (
            <div
              key={dateStr}
              onClick={() => count > 0 ? setExpandDay(isExpanded ? null : dateStr) : undefined}
              className={`relative min-h-[60px] p-1 rounded-lg border text-xs transition
                ${isToday ? "border-blue-400 bg-blue-50" : "border-gray-100 hover:border-gray-300"}
                ${count > 0 ? "cursor-pointer" : ""}
                ${isExpanded ? "ring-2 ring-blue-400" : ""}
              `}
            >
              <div className={`font-semibold ${isToday ? "text-blue-600" : "text-gray-600"}`}>
                {day}
              </div>
              {count > 0 && (
                <div className={`mt-0.5 text-center rounded py-0.5 text-xs font-bold ${
                  count >= 10 ? "bg-red-100 text-red-600" :
                  count >= 5 ? "bg-orange-100 text-orange-600" :
                  count >= 2 ? "bg-blue-100 text-blue-600" :
                  "bg-green-100 text-green-600"
                }`}>
                  {count}件
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 展开某天的案件列表 */}
      {expandDay && (etaMap.get(expandDay) || []).length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">{expandDay} 的派送案件 ({(etaMap.get(expandDay) || []).length}件)</h4>
            <button onClick={() => setExpandDay(null)} className="text-xs text-gray-400 hover:text-red-500">关闭</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">案件番号</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">客户</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">主题</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Mode</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">AWB</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">ETD</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">备注</th>
                </tr>
              </thead>
              <tbody>
                {(etaMap.get(expandDay) || []).map((c, i) => (
                  <tr key={c.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-3 py-2 font-mono text-xs font-semibold text-gray-700">{c.case_number}</td>
                    <td className="px-3 py-2 text-gray-600">{c.customer_name}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate text-gray-600">{c.theme || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                        c.mode === "Export" ? "bg-blue-50 text-blue-600" :
                        c.mode === "Import" ? "bg-green-50 text-green-600" :
                        "bg-gray-100 text-gray-500"
                      }`}>{c.mode || "—"}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{c.awb_no || "—"}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{c.etd || "—"}</td>
                    <td className="px-3 py-2 text-xs text-gray-400 max-w-[150px] truncate">{c.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
