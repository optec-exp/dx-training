"use client";

import { useState } from "react";

type ClassificationResult = {
  category: string;
  confidence: number; // 0 ~ 1
  reason: string;
};

const CATEGORIES = ["投诉", "咨询", "表扬", "建议", "其他"];

// 根据置信度高低返回颜色和文字标签
function confidenceLevel(pct: number) {
  if (pct >= 80) return { color: "#16a34a", label: "高" }; // 绿
  if (pct >= 50) return { color: "#d97706", label: "中" }; // 黄
  return { color: "#dc2626", label: "低" }; // 红
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(confidence * 100)));
  const { color, label } = confidenceLevel(pct);
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <span style={{ color: "#888", fontSize: 13 }}>置信度</span>
        <span style={{ fontSize: 15, fontWeight: 600, color }}>
          {pct}% · {label}
        </span>
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: "#eef0f2",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 999,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState("");

  async function handleClassify() {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "分类失败，请稍后重试");
        return;
      }

      setResult(data as ClassificationResult);
    } catch {
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: "0 20px",
      }}
    >
      <h1>AI 数据分类工具</h1>
      <p style={{ color: "#555" }}>
        输入一段文本（如客户反馈、邮件主题），自动判断类别并给出置信度评分与分类理由。
      </p>

      <p style={{ fontSize: 13, color: "#888" }}>
        可分类别：{CATEGORIES.join(" / ")}
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="在这里粘贴要分类的文本，例如：你们的产品到货后包装破损，要求退货！"
        rows={6}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 15,
          borderRadius: 8,
          border: "1px solid #d0d0d0",
          resize: "vertical",
          fontFamily: "inherit",
        }}
      />

      <button
        onClick={handleClassify}
        disabled={loading || !text.trim()}
        style={{
          marginTop: 12,
          padding: "10px 24px",
          fontSize: 15,
          borderRadius: 8,
          border: "none",
          background: loading || !text.trim() ? "#b8c4d0" : "#2563eb",
          color: "#fff",
          cursor: loading || !text.trim() ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "分类中…" : "开始分类"}
      </button>

      {/* 结果展示区 */}
      <section style={{ marginTop: 28 }}>
        {loading && <p style={{ color: "#888" }}>正在分析文本…</p>}

        {error && (
          <div
            style={{
              padding: 14,
              borderRadius: 8,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div
            style={{
              padding: 20,
              borderRadius: 10,
              background: "#fff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: "#888", fontSize: 13 }}>分类结果</span>
              <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>
                {result.category}
              </div>
            </div>

            <ConfidenceBar confidence={result.confidence} />

            <div>
              <span style={{ color: "#888", fontSize: 13 }}>分类理由</span>
              <div style={{ marginTop: 4, lineHeight: 1.6 }}>{result.reason}</div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
