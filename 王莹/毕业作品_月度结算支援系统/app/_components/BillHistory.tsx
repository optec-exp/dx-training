"use client";

import { useEffect, useState } from "react";
import Collapsible from "./Collapsible";

interface Bill { id: string; 供应商: string; 类型: string; 原币种: string; 账单总额_原币: number; 利润月: string; created_at: string; 原件链接: string | null }
const yen = (n: number) => Math.round(n).toLocaleString("ja-JP");

export default function BillHistory({ refresh = 0 }: { refresh?: number }) {
  const [rows, setRows] = useState<Bill[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { fetch("/api/bills").then((x) => x.json()).then((d) => { setRows(d.rows || d.bills || []); setLoaded(true); }).catch(() => setLoaded(true)); }, [refresh]);
  if (!loaded) return null;
  return (
    <Collapsible title="已上传账单历史" right={<span style={{ color: "var(--muted)", fontSize: 13 }}>{rows.length} 张</span>}>
      {rows.length === 0 ? <div style={{ color: "var(--muted)" }}>暂无</div> : (
        <table className="report-table" style={{ boxShadow: "none", margin: 0 }}>
          <thead><tr><th>上传时间</th><th>利润月</th><th>供应商</th><th>类型</th><th className="num">总额</th><th>原件</th></tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td style={{ fontSize: 12 }}>{b.created_at?.replace("T", " ").slice(0, 16)}</td>
                <td>{b.利润月}</td><td>{b.供应商}</td><td>{b.类型}</td>
                <td className="num strong">{b.原币种} {yen(b.账单总额_原币)}</td>
                <td>{b.原件链接 ? <a href={b.原件链接} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>📄 查看</a> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Collapsible>
  );
}
