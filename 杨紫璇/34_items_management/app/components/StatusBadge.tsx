import type { ItemStatus } from "@/lib/supabase";

const styles: Record<ItemStatus, { bg: string; color: string }> = {
  可用: { bg: "#dcfce7", color: "#166534" },
  借出中: { bg: "#dbeafe", color: "#1e40af" },
  维修中: { bg: "#fed7aa", color: "#9a3412" },
  报废: { bg: "#e5e7eb", color: "#4b5563" },
};

export default function StatusBadge({ status }: { status: ItemStatus }) {
  const s = styles[status] ?? styles["报废"];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        background: s.bg,
        color: s.color,
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}
