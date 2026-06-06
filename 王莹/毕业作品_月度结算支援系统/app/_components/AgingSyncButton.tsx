"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AgingSyncButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function run() {
    setBusy(true); setErr(null);
    try {
      const refDate = new Date().toISOString().slice(0, 10);
      const r = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "aging", refDate }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
      router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }
  return (
    <>
      <button className="btn primary" disabled={busy} onClick={run}>{busy ? "同步中…（读 Kintone）" : "↻ 同步应收应付账龄"}</button>
      {err && <span style={{ color: "var(--red)", fontSize: 12, marginLeft: 8 }}>{err}</span>}
    </>
  );
}
