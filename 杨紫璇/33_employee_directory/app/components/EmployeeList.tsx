"use client";

import { useMemo, useState } from "react";
import type { Employee } from "@/lib/supabase";
import EmployeeRow from "./EmployeeRow";

export default function EmployeeList({ employees }: { employees: Employee[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((emp) => {
      const haystack = [
        emp.name,
        emp.email,
        emp.department ?? "",
        emp.phone ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [employees, query]);

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 搜索姓名 / 邮箱 / 部门 / 电话…"
          style={{
            width: "100%",
            padding: "10px 14px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "14px",
            outline: "none",
            background: "white",
          }}
        />
        {query && (
          <p style={{ marginTop: "6px", fontSize: "13px", color: "#6b7280" }}>
            找到 {filtered.length} 条匹配结果
          </p>
        )}
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
          {query ? "未找到匹配的员工" : "暂无员工数据"}
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
                <th style={th}>姓名</th>
                <th style={th}>邮箱</th>
                <th style={th}>部门</th>
                <th style={th}>电话</th>
                <th style={th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <EmployeeRow key={emp.id} employee={emp} />
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
