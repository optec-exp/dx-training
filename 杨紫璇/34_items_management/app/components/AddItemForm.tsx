"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type ItemStatus } from "@/lib/supabase";

const STATUSES: ItemStatus[] = ["可用", "借出中", "维修中", "报废"];

export default function AddItemForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<ItemStatus>("可用");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setCategory("");
    setCode("");
    setStatus("可用");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("物品名称必填");
      return;
    }

    setSaving(true);
    const { error: insertError } = await supabase.from("items").insert({
      name: name.trim(),
      category: category.trim() || null,
      code: code.trim() || null,
      status,
    });
    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    reset();
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={primaryBtn}>
        + 登记新物品
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        marginBottom: "20px",
      }}
    >
      <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
        登记新物品
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <label style={labelStyle}>
          名称 <span style={{ color: "#ef4444" }}>*</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            placeholder="例：MacBook Pro 14寸"
          />
        </label>
        <label style={labelStyle}>
          类别
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={inputStyle}
            placeholder="例：PC / 显示器 / 办公设备"
          />
        </label>
        <label style={labelStyle}>
          编号
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={inputStyle}
            placeholder="例：PC-003"
          />
        </label>
        <label style={labelStyle}>
          状态
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ItemStatus)}
            style={inputStyle}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div
          style={{
            padding: "10px 12px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "6px",
            fontSize: "13px",
            marginBottom: "12px",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        <button type="submit" disabled={saving} style={primaryBtn}>
          {saving ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          style={secondaryBtn}
        >
          取消
        </button>
      </div>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  fontSize: "13px",
  color: "#374151",
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "14px",
  outline: "none",
  background: "white",
};

const primaryBtn: React.CSSProperties = {
  padding: "8px 16px",
  background: "#3b82f6",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: 500,
};

const secondaryBtn: React.CSSProperties = {
  padding: "8px 16px",
  background: "white",
  color: "#374151",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: 500,
};
