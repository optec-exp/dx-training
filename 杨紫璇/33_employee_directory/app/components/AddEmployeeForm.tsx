"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AddEmployeeForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setEmail("");
    setDepartment("");
    setPhone("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError("姓名和邮箱必填");
      return;
    }

    setSaving(true);
    const { error: insertError } = await supabase.from("employees").insert({
      name: name.trim(),
      email: email.trim(),
      department: department.trim() || null,
      phone: phone.trim() || null,
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
        + 添加员工
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
        添加新员工
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
          姓名 <span style={{ color: "#ef4444" }}>*</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            placeholder="例：田中太郎"
          />
        </label>
        <label style={labelStyle}>
          邮箱 <span style={{ color: "#ef4444" }}>*</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="example@optec-exp.com"
          />
        </label>
        <label style={labelStyle}>
          部门
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={inputStyle}
            placeholder="例：物流部"
          />
        </label>
        <label style={labelStyle}>
          电话
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
            placeholder="例：090-1234-5678"
          />
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
