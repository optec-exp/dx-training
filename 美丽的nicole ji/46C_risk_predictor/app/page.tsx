"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase 客户端（使用 NEXT_PUBLIC_ 开头的环境变量）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================
// 类型定义
// ============================================================
type Case = {
  id: number;
  case_number: string;
  customer_name: string;
  awb_number: string;
  origin: string;
  destination: string;
  cargo_type: string;
  weight_kg: number;
  status: string;
  eta: string;
  notes: string;
};

type Analysis = {
  id: number;
  risk_level: "高" | "中" | "低";
  risk_score: number;
  bottleneck: string;
  priority_action: string;
  reason: string;
};

// ============================================================
// 样式映射
// ============================================================
const STATUS_LABEL: Record<string, string> = {
  pending: "待处理",
  in_transit: "运输中",
  customs_hold: "海关滞留",
  delayed: "延误",
  delivered: "已送达",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  in_transit: "bg-blue-100 text-blue-700",
  customs_hold: "bg-orange-100 text-orange-700",
  delayed: "bg-red-100 text-red-700",
  delivered: "bg-green-100 text-green-700",
};

const RISK_STYLE: Record<string, string> = {
  高: "bg-red-100 text-red-700 border-red-200",
  中: "bg-yellow-100 text-yellow-700 border-yellow-200",
  低: "bg-green-100 text-green-700 border-green-200",
};

const RISK_BAR: Record<string, string> = {
  高: "bg-red-500",
  中: "bg-yellow-400",
  低: "bg-green-500",
};

// ETA 剩余天数
function etaDiff(etaStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eta = new Date(etaStr);
  eta.setHours(0, 0, 0, 0);
  return Math.round((eta.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================================
export default function Home() {
  const [cases, setCases] = useState<Case[]>([]);
  const [analyses, setAnalyses] = useState<Record<number, Analysis>>({});
  const [slackSent, setSlackSent] = useState<Record<number, boolean>>({});
  const [slackConfigured, setSlackConfigured] = useState(false);
  const [loadingCases, setLoadingCases] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  // ---------- 从 Supabase 读取案件 ----------
  useEffect(() => {
    (async () => {
      setLoadingCases(true);
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("eta", { ascending: true });

      if (error) {
        setError("读取案件失败：" + error.message);
      } else {
        setCases(data ?? []);
      }
      setLoadingCases(false);
    })();
  }, []);

  // ---------- 一键分析所有案件 ----------
  const handleAnalyze = async () => {
    if (cases.length === 0 || analyzing) return;
    setAnalyzing(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cases }),
      });

      if (!res.ok) {
        setError(await res.text());
        return;
      }

      const data = (await res.json()) as {
        analyses: Analysis[];
        slack_sent: Record<number, boolean>;
        slack_configured: boolean;
      };

      // 把数组转成以 id 为 key 的字典，方便查找
      const map: Record<number, Analysis> = {};
      for (const a of data.analyses) {
        map[a.id] = a;
      }
      setAnalyses(map);
      setSlackSent(data.slack_sent ?? {});
      setSlackConfigured(data.slack_configured);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setAnalyzing(false);
    }
  };

  // ---------- 统计 ----------
  const analyzed = Object.values(analyses);
  const highCount = analyzed.filter((a) => a.risk_level === "高").length;
  const midCount = analyzed.filter((a) => a.risk_level === "中").length;
  const lowCount = analyzed.filter((a) => a.risk_level === "低").length;
  const hasAnalysis = analyzed.length > 0;

  // ---------- 筛选 ----------
  const [filter, setFilter] = useState<"全部" | "高" | "中" | "低">("全部");

  // ---------- 详情弹窗 ----------
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const filteredCases = cases.filter((c) => {
    if (filter === "全部") return true;
    const a = analyses[c.id];
    return a?.risk_level === filter;
  });

  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              AI
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-800">
                AI 案件风险预测
              </h1>
              <p className="text-xs text-gray-400">
                延迟风险 · 瓶颈识别 · Slack 通知
              </p>
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || cases.length === 0}
            className="bg-rose-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {analyzing && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {analyzing ? "AI分析中..." : "一键分析所有案件"}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 分析完成后的统计栏 */}
        {hasAnalysis && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "总案件", value: cases.length, color: "text-gray-800", key: "全部" as const },
              { label: "高风险", value: highCount,    color: "text-red-600",    key: "高" as const },
              { label: "中风险", value: midCount,     color: "text-yellow-600", key: "中" as const },
              { label: "低风险", value: lowCount,     color: "text-green-600",  key: "低" as const },
            ].map((s) => (
              <div
                key={s.label}
                onClick={() => setFilter(filter === s.key ? "全部" : s.key)}
                className={`bg-white rounded-xl border p-4 text-center shadow-sm cursor-pointer transition-all ${
                  filter === s.key
                    ? "border-rose-400 ring-2 ring-rose-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Slack 通知说明 */}
        {hasAnalysis && highCount > 0 && (
          <div
            className={`rounded-xl px-4 py-3 text-sm border ${
              slackConfigured
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-yellow-50 border-yellow-200 text-yellow-700"
            }`}
          >
            {slackConfigured
              ? `✅ 已向 Slack 发送 ${highCount} 个高风险案件警报`
              : "⚠️ Slack 未配置（未设置 SLACK_WEBHOOK_URL），高风险警报未发送"}
          </div>
        )}

        {/* 案件列表 */}
        {loadingCases ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-3" />
            读取案件中...
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Supabase 中没有案件数据，请先执行 SQL 建表并插入示例数据
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCases.map((c) => {
              const a = analyses[c.id];
              const diff = etaDiff(c.eta);

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm cursor-pointer hover:border-rose-300 hover:shadow-md transition-all"
                >
                  {/* 上半部分：案件信息 */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-800">
                          {c.case_number}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            STATUS_STYLE[c.status] ??
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_LABEL[c.status] ?? c.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {c.customer_name} &nbsp;|&nbsp; AWB: {c.awb_number}
                        &nbsp;|&nbsp; {c.origin} → {c.destination}
                        &nbsp;|&nbsp; {c.cargo_type} {c.weight_kg}kg
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p className="font-medium text-gray-700">
                        ETA: {c.eta}
                      </p>
                      <p
                        className={
                          diff < 0
                            ? "text-red-500 font-bold"
                            : diff <= 2
                            ? "text-orange-500"
                            : "text-gray-400"
                        }
                      >
                        {diff >= 0 ? `还有 ${diff} 天` : `已过 ${Math.abs(diff)} 天`}
                      </p>
                    </div>
                  </div>

                  {/* 备注 */}
                  {c.notes && (
                    <p className="text-xs text-gray-400 mb-4">
                      备注：{c.notes}
                    </p>
                  )}

                  {/* AI 分析结果 */}
                  {a ? (
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                      {/* 风险等级 + 进度条 */}
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full border ${
                            RISK_STYLE[a.risk_level]
                          }`}
                        >
                          {a.risk_level}风险
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              RISK_BAR[a.risk_level]
                            }`}
                            style={{
                              width: `${(a.risk_score * 100).toFixed(0)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 tabular-nums">
                          {(a.risk_score * 100).toFixed(0)}%
                        </span>
                        {/* Slack 已发送标记 */}
                        {a.risk_level === "高" && slackSent[c.id] && (
                          <span className="text-xs text-green-600 font-medium">
                            Slack ✓
                          </span>
                        )}
                      </div>

                      {/* 瓶颈 / 优先处理 / 理由 */}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
                        <div className="bg-red-50 rounded-lg px-3 py-2">
                          <p className="text-red-400 font-medium mb-0.5">
                            瓶颈
                          </p>
                          <p className="text-gray-700">{a.bottleneck}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg px-3 py-2">
                          <p className="text-blue-400 font-medium mb-0.5">
                            优先处理
                          </p>
                          <p className="text-gray-700">{a.priority_action}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-gray-400 font-medium mb-0.5">
                            判断理由
                          </p>
                          <p className="text-gray-700">{a.reason}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs text-gray-300">
                        点击「一键分析所有案件」获取AI风险预测
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 详情弹窗 */}
      {selectedCase && (() => {
        const c = selectedCase;
        const a = analyses[c.id];
        const diff = etaDiff(c.eta);
        return (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
            onClick={() => setSelectedCase(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 弹窗标题 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-gray-800">{c.case_number}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </div>
                <button onClick={() => setSelectedCase(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>

              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "客户",   value: c.customer_name },
                  { label: "AWB",    value: c.awb_number },
                  { label: "出发地", value: c.origin },
                  { label: "目的地", value: c.destination },
                  { label: "货物",   value: `${c.cargo_type} ${c.weight_kg}kg` },
                  { label: "ETA",    value: `${c.eta}（${diff >= 0 ? `还有 ${diff} 天` : `已过 ${Math.abs(diff)} 天`}）` },
                ].map((row) => (
                  <div key={row.label} className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-400 mb-0.5">{row.label}</p>
                    <p className="text-gray-800 font-medium">{row.value}</p>
                  </div>
                ))}
              </div>

              {/* 备注 */}
              {c.notes && (
                <div className="bg-yellow-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                  <span className="text-yellow-600 font-medium">备注：</span>{c.notes}
                </div>
              )}

              {/* AI 分析结果 */}
              {a ? (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${RISK_STYLE[a.risk_level]}`}>
                      {a.risk_level}风险
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${RISK_BAR[a.risk_level]}`}
                        style={{ width: `${(a.risk_score * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{(a.risk_score * 100).toFixed(0)}%</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="bg-red-50 rounded-lg px-3 py-2">
                      <p className="text-red-400 font-medium mb-0.5">瓶颈</p>
                      <p className="text-gray-700">{a.bottleneck}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg px-3 py-2">
                      <p className="text-blue-400 font-medium mb-0.5">优先处理</p>
                      <p className="text-gray-700">{a.priority_action}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-gray-400 font-medium mb-0.5">判断理由</p>
                      <p className="text-gray-700">{a.reason}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-300 pt-2">尚未进行AI分析</p>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
