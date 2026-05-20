"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Employee } from "@/lib/supabase";

export default function EmployeeRow({ employee }: { employee: Employee }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(employee.name);
  const [email, setEmail] = useState(employee.email);
  const [department, setDepartment] = useState(employee.department ?? "");
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    const ok = window.confirm(
      `确定要删除员工「${employee.name}」吗？此操作不可撤销。`
    );
    if (!ok) return;

    setDeleting(true);
    const { error: deleteError } = await supabase
      .from("employees")
      .delete()
      .eq("id", employee.id);
    setDeleting(false);

    if (deleteError) {
      window.alert("删除失败：" + deleteError.message);
      return;
    }

    router.refresh();
  };

  const handleSave = async () => {
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError("姓名和邮箱必填");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase
      .from("employees")
      .update({
        name: name.trim(),
        email: email.trim(),
        department: department.trim() || null,
        phone: phone.trim() || null,
      })
      .eq("id", employee.id);
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setEditing(false);
    router.refresh();
  };

  const handleCancel = () => {
    setName(employee.name);
    setEmail(employee.email);
    setDepartment(employee.department ?? "");
    setPhone(employee.phone ?? "");
    setError(null);
    setEditing(false);
  };

  if (editing) {
    return (
      <tr style={{ borderTop: "1px solid #f3f4f6", background: "#fffbeb" }}>
        <td style={td}>{employee.id}</td>
        <td style={td}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </td>
        <td style={td}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </td>
        <td style={td}>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={inputStyle}
          />
        </td>
        <td style={td}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
          />
        </td>
        <td style={td}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button onClick={handleSave} disabled={saving} style={primaryBtn}>
              {saving ? "保存中" : "保存"}
            </button>
            <button onClick={handleCancel} style={secondaryBtn}>
              取消
            </button>
          </div>
          {error && (
            <div style={{ color: "#991b1b", fontSize: "12px", marginTop: "4px" }}>
              {error}
            </div>
          )}
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ borderTop: "1px solid #f3f4f6" }}>
      <td style={td}>{employee.id}</td>
      <td style={{ ...td, fontWeight: 600 }}>{employee.name}</td>
      <td style={td}>{employee.email}</td>
      <td style={td}>{employee.department ?? "—"}</td>
      <td style={td}>{employee.phone ?? "—"}</td>
      <td style={td}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button onClick={() => setEditing(true)} style={secondaryBtn}>
            编辑
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={dangerBtn}
          >
            {deleting ? "删除中" : "删除"}
          </button>
        </div>
      </td>
    </tr>
  );
}

const td: React.CSSProperties = {
  padding: "14px 16px",
  color: "#1f2937",
  verticalAlign: "middle",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "13px",
  outline: "none",
};

const primaryBtn: React.CSSProperties = {
  padding: "6px 12px",
  background: "#3b82f6",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 500,
};

const secondaryBtn: React.CSSProperties = {
  padding: "6px 12px",
  background: "white",
  color: "#374151",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 500,
};

const dangerBtn: React.CSSProperties = {
  padding: "6px 12px",
  background: "white",
  color: "#b91c1c",
  border: "1px solid #fecaca",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 500,
};
