"use client";

import { useState } from "react";
import styles from "./page.module.css";

const PURPOSES = [
  "通知 / 告知",
  "请求 / 委托",
  "道歉",
  "感谢",
  "邀请",
  "确认 / 跟进",
  "其他",
];

const RELATIONS = [
  "客户",
  "上司 / 领导",
  "同事",
  "下属",
  "供应商 / 合作方",
  "初次联系",
];

const TONES = ["标准商务", "高度正式（郑重）", "亲切礼貌"];

interface LangEmail {
  subject: string;
  body: string;
}

interface GenerateResult {
  japanese: LangEmail;
  english: LangEmail;
  chinese: LangEmail;
}

function LangCard({ label, email }: { label: string; email: LangEmail }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = `${email.subject}\n\n${email.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 个别浏览器/非安全上下文不支持剪贴板，此处静默忽略
    }
  };

  return (
    <div className={styles.langCard}>
      <div className={styles.langHeader}>
        <span className={styles.langLabel}>{label}</span>
        <button
          className={`${styles.copyBtn} ${copied ? styles.copied : ""}`}
          onClick={handleCopy}
        >
          {copied ? "已复制 ✓" : "一键复制"}
        </button>
      </div>
      <div className={styles.subjectLine}>
        <span className={styles.subjectTag}>主题：</span>
        {email.subject}
      </div>
      <div className={styles.emailBody}>{email.body}</div>
    </div>
  );
}

export default function Home() {
  const [points, setPoints] = useState("");
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [relation, setRelation] = useState(RELATIONS[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [recipient, setRecipient] = useState("");
  const [signature, setSignature] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);

  const handleGenerate = async () => {
    if (!points.trim()) {
      setError("请先填写邮件要点。");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points,
          purpose,
          relation,
          tone,
          recipient,
          signature,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "生成失败，请稍后重试。");
        return;
      }
      setResult(data);
    } catch {
      setError("网络错误，请检查连接后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>商务邮件三语草稿助手</h1>
        <p className={styles.subtitle}>
          输入要点，自动生成日语 / 英语 / 中文三版商务邮件草稿。
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.field}>
          <label className={styles.label}>
            邮件要点
            <span className={styles.hint}>
              用大白话写清想表达的事，越具体越好
            </span>
          </label>
          <textarea
            className={styles.textarea}
            placeholder="例：通知客户下周一的货物因台风延迟 3 天发出，对此表示歉意，并说明新的预计到货日为 6 月 5 日。"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>邮件目的</label>
            <select
              className={styles.select}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={loading}
            >
              {PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>收件人关系</label>
            <select
              className={styles.select}
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              disabled={loading}
            >
              {RELATIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>语气</label>
            <select
              className={styles.select}
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              disabled={loading}
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>
              收件人称呼
              <span className={styles.hint}>建议填写，三语效果最佳，如：田中部长</span>
            </label>
            <input
              className={styles.input}
              placeholder="留空则用通用称呼（日语可能略有瑕疵）"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              署名
              <span className={styles.hint}>选填，如：Optec / 王莹</span>
            </label>
            <input
              className={styles.input}
              placeholder="公司 / 姓名"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <button
          className={styles.button}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "正在生成三语邮件…" : "生成三语邮件"}
        </button>

        {error && <div className={styles.error}>{error}</div>}
      </div>

      {result && (
        <div className={styles.results}>
          <LangCard label="日本語" email={result.japanese} />
          <LangCard label="English" email={result.english} />
          <LangCard label="中文" email={result.chinese} />
        </div>
      )}
    </main>
  );
}
