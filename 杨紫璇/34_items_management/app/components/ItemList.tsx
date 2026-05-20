"use client";

import { useMemo, useState } from "react";
import type { Item, ItemStatus } from "@/lib/supabase";
import ItemRow from "./ItemRow";

type StatusFilter = "全部" | ItemStatus;
type SortField = "id" | "name" | "status" | "created_at";
type SortOrder = "asc" | "desc";

const STATUS_FILTERS: StatusFilter[] = [
  "全部",
  "可用",
  "借出中",
  "维修中",
  "报废",
];

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: "id", label: "ID" },
  { value: "name", label: "名称" },
  { value: "status", label: "状态" },
  { value: "created_at", label: "登记时间" },
];

export default function ItemList({ items }: { items: Item[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("全部");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const filtered = useMemo(() => {
    let list = items;

    // 状态过滤
    if (statusFilter !== "全部") {
      list = list.filter((it) => it.status === statusFilter);
    }

    // 排序
    const sorted = [...list].sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return sortOrder === "asc" ? -1 : 1;
      if (va > vb) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [items, statusFilter, sortField, sortOrder]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "16px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <label style={controlLabel}>
          状态：
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            style={controlInput}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label style={controlLabel}>
          排序：
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            style={controlInput}
          >
            {SORT_FIELDS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={() =>
            setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
          }
          style={orderBtn}
        >
          {sortOrder === "asc" ? "↑ 升序" : "↓ 降序"}
        </button>

        <span style={{ marginLeft: "auto", color: "#6b7280", fontSize: "13px" }}>
          显示 {filtered.length} / {items.length} 件
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            color: "#6b7280",
            background: "white",
            borderRadius: "12px",
            border: "1px dashed #d1d5db",
          }}
        >
          {statusFilter === "全部"
            ? "暂无物品数据"
            : `没有状态为「${statusFilter}」的物品`}
        </div>
      ) : (
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>名称</th>
                <th style={th}>类别</th>
                <th style={th}>编号</th>
                <th style={th}>状态</th>
                <th style={th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontWeight: 600,
  color: "#4b5563",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const controlLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "13px",
  color: "#374151",
};

const controlInput: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "13px",
  background: "white",
  outline: "none",
};

const orderBtn: React.CSSProperties = {
  padding: "6px 12px",
  background: "white",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "13px",
  color: "#374151",
  fontWeight: 500,
};
