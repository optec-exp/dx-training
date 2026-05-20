import type { BorrowHistory } from "@/lib/supabase";

export default function HistoryPanel({
  history,
}: {
  history: BorrowHistory[];
}) {
  if (history.length === 0) {
    return (
      <div
        style={{
          padding: "16px 20px",
          background: "#f9fafb",
          color: "#6b7280",
          fontSize: "13px",
          fontStyle: "italic",
        }}
      >
        该物品暂无借出记录
      </div>
    );
  }

  const sorted = [...history].sort((a, b) =>
    b.borrowed_at.localeCompare(a.borrowed_at)
  );

  return (
    <div
      style={{
        padding: "16px 20px",
        background: "#f9fafb",
        borderTop: "1px solid #f3f4f6",
      }}
    >
      <h3
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#4b5563",
          marginBottom: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        借出历史（共 {history.length} 条）
      </h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
          background: "white",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <thead style={{ background: "#f3f4f6" }}>
          <tr>
            <th style={subTh}>借出人</th>
            <th style={subTh}>借出时间</th>
            <th style={subTh}>归还时间</th>
            <th style={subTh}>备注</th>
            <th style={subTh}>状态</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((h) => {
            const returned = !!h.returned_at;
            return (
              <tr key={h.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={subTd}>{h.borrower}</td>
                <td style={subTd}>{formatDate(h.borrowed_at)}</td>
                <td style={subTd}>
                  {h.returned_at ? formatDate(h.returned_at) : "—"}
                </td>
                <td style={{ ...subTd, color: "#6b7280" }}>
                  {h.notes ?? "—"}
                </td>
                <td style={subTd}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: 600,
                      background: returned ? "#dcfce7" : "#fef3c7",
                      color: returned ? "#166534" : "#92400e",
                    }}
                  >
                    {returned ? "已归还" : "借出中"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

const subTh: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  fontWeight: 600,
  color: "#6b7280",
  fontSize: "12px",
};

const subTd: React.CSSProperties = {
  padding: "8px 12px",
  color: "#1f2937",
};
