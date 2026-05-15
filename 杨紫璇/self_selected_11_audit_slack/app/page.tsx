"use client";

import { useState } from "react";
import styles from "./page.module.css";

type AuditRecord = {
  id: string;
  assignee: string;
  title: string;
  auditDate: string;
  sent: boolean;
};

type LogEntry = { type: "ok" | "err" | "info"; msg: string; time: string };

function getField(rec: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = rec[key] as { value: unknown } | string | undefined;
    if (!val) continue;
    if (typeof val === "string") return val;
    if (typeof val === "object" && "value" in val) {
      const v = val.value;
      // ユーザー選択フィールド: [{code, name}, ...]
      if (Array.isArray(v)) {
        return v.map((u: { name?: string; code?: string }) => u.name || u.code || "").join(", ");
      }
      if (typeof v === "string") return v;
    }
  }
  return "";
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function Home() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [allSent, setAllSent] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  function addLog(type: LogEntry["type"], msg: string) {
    setLogs((prev) => [
      ...prev,
      { type, msg, time: new Date().toLocaleTimeString("ja-JP") },
    ]);
  }

  async function handleSearch() {
    setSearching(true);
    setSearched(false);
    setRecords([]);
    setAllSent(false);
    setLogs([]);

    try {
      const res = await fetch(`/api/audits?date=${date}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      const parsed: AuditRecord[] = (data.records || []).map(
        (rec: Record<string, { value: string }>, idx: number) => ({
          id: String(idx),
          assignee: getField(rec, ["負責人_0", "负责人_0", "負責人", "负责人", "担当者", "assignee", "内审负责人"]) || "（未填写）",
          title: getField(rec, ["標題", "title", "任务名称", "内审项目"]) || "月度内审",
          auditDate: getField(rec, ["月度内审日期", "audit_date", "内审日期", "日期"]) || date,
          sent: false,
        })
      );

      setRecords(parsed);
      setSearched(true);
    } catch (err) {
      addLog("err", `搜索失败：${String(err)}`);
      alert(`搜索失败：${String(err)}`);
    } finally {
      setSearching(false);
    }
  }

  async function handleSendAll() {
    if (allSent || sending) return;
    setSending(true);
    addLog("info", `📤 开始发送 ${records.length} 条通知…`);

    let successCount = 0;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const payload = buildSlackPayload(rec.assignee, rec.title, rec.auditDate);

      try {
        const res = await fetch("/api/slack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

        setRecords((prev) =>
          prev.map((r) => (r.id === rec.id ? { ...r, sent: true } : r))
        );
        successCount++;
        addLog("ok", `✅ [${i + 1}/${records.length}] 已发送 → ${rec.assignee}`);
      } catch (err) {
        addLog("err", `❌ [${i + 1}/${records.length}] 失败 → ${rec.assignee}：${String(err)}`);
      }

      if (i < records.length - 1) await sleep(600);
    }

    setAllSent(true);
    setSending(false);
    addLog("info", `🎉 完成：成功 ${successCount} / 共 ${records.length}`);
  }

  function buildSlackPayload(assignee: string, title: string, auditDate: string) {
    return {
      text: "📋 月度内审提醒",
      blocks: [
        { type: "header", text: { type: "plain_text", text: "📋 月度内审提醒", emoji: true } },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*担当者：*\n${assignee}` },
            { type: "mrkdwn", text: `*内审日期：*\n${auditDate}` },
            { type: "mrkdwn", text: `*项目：*\n${title}` },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `> ${assignee} さん、${auditDate} に月度内审が予定されています。\n> 内容を確認し、当日の準備をお願いします。🙏`,
          },
        },
        { type: "divider" },
        {
          type: "context",
          elements: [
            { type: "mrkdwn", text: `🤖 月度内审 Slack 自动提醒工具 | ${new Date().toLocaleString("ja-JP")}` },
          ],
        },
      ],
    };
  }

  return (
    <main className={styles.main}>
      {/* Header */}
      <div className={styles.header}>
        <h1>月度内审 Slack 自动提醒工具</h1>
        <p>指定日期筛选 Kintone 内审任务 → 确认后触发 Slack 通知</p>
        <div className={styles.tags}>
          <span className={`${styles.tag} ${styles.tagBlue}`}>Kintone REST API</span>
          <span className={`${styles.tag} ${styles.tagPurple}`}>Slack Webhook</span>
          <span className={`${styles.tag} ${styles.tagGray}`}>fetch</span>
          <span className={`${styles.tag} ${styles.tagGray}`}>async/await</span>
          <span className={`${styles.tag} ${styles.tagGray}`}>環境変数</span>
        </div>
      </div>

      {/* Search Panel */}
      <div className={styles.panel}>
        <div className={styles.panelTitle}>📅 日期筛选</div>
        <div className={styles.searchRow}>
          <input
            type="date"
            className={styles.dateInput}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? <span className={styles.spinner} /> : "🔍"} 搜索
          </button>
        </div>
      </div>

      {/* Results Panel */}
      {searched && (
        <div className={styles.panel}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsCount}>
              找到 <span>{records.length}</span> 件内审任务
            </div>
            {records.length > 0 && (
              <button
                className={`${styles.btn} ${allSent ? styles.btnSent : styles.btnSuccess}`}
                onClick={handleSendAll}
                disabled={sending || allSent}
              >
                {sending ? <><span className={styles.spinner} /> 发送中…</> : allSent ? `✅ 已全部发送（${records.length}/${records.length}）` : "📨 发送 Slack 通知"}
              </button>
            )}
          </div>

          {records.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <div>该日期无内审预定</div>
            </div>
          ) : (
            <div className={styles.recordList}>
              {records.map((rec) => (
                <div key={rec.id} className={`${styles.card} ${rec.sent ? styles.cardSent : ""}`}>
                  <div className={styles.cardLeft}>
                    <div className={styles.avatar}>{rec.assignee.charAt(0).toUpperCase()}</div>
                    <div className={styles.recordInfo}>
                      <strong>{rec.assignee}</strong>
                      <small>{rec.title} &nbsp;|&nbsp; 📅 {rec.auditDate}</small>
                    </div>
                  </div>
                  <span className={`${styles.badge} ${rec.sent ? styles.badgeSent : styles.badgePending}`}>
                    {rec.sent ? "已发送" : "未发送"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Log */}
          {logs.length > 0 && (
            <div className={styles.logPanel}>
              <div className={styles.logTitle}>📋 发送日志</div>
              <div className={styles.logList}>
                {logs.map((log, i) => (
                  <div key={i} className={`${styles.logItem} ${styles[`log-${log.type}`]}`}>
                    [{log.time}]  {log.msg}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
