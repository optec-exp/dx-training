"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Item, type ItemStatus } from "@/lib/supabase";
import StatusBadge from "./StatusBadge";
import HistoryPanel from "./HistoryPanel";

const STATUSES: ItemStatus[] = ["可用", "借出中", "维修中", "报废"];

export default function ItemRow({ item }: { item: Item }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category ?? "");
  const [code, setCode] = useState(item.code ?? "");
  const [status, setStatus] = useState<ItemStatus>(item.status);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [borrowing, setBorrowing] = useState(false);
  const [borrower, setBorrower] = useState("");
  const [borrowNotes, setBorrowNotes] = useState("");
  const [borrowSubmitting, setBorrowSubmitting] = useState(false);
  const [borrowError, setBorrowError] = useState<string | null>(null);

  const handleBorrowSubmit = async () => {
    setBorrowError(null);

    if (!borrower.trim()) {
      setBorrowError("借出人必填");
      return;
    }

    setBorrowSubmitting(true);

    // Step 1: 在 borrow_history 表新增一行
    const { error: insertError } = await supabase
      .from("borrow_history")
      .insert({
        item_id: item.id,
        borrower: borrower.trim(),
        notes: borrowNotes.trim() || null,
      });

    if (insertError) {
      setBorrowSubmitting(false);
      setBorrowError("写入借出记录失败：" + insertError.message);
      return;
    }

    // Step 2: 更新 items 表的 status 为 "借出中"
    const { error: updateError } = await supabase
      .from("items")
      .update({ status: "借出中" })
      .eq("id", item.id);

    setBorrowSubmitting(false);

    if (updateError) {
      setBorrowError("更新物品状态失败：" + updateError.message);
      return;
    }

    setBorrower("");
    setBorrowNotes("");
    setBorrowing(false);
    router.refresh();
  };

  const [returning, setReturning] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  const handleDiscard = async () => {
    if (
      !window.confirm(
        `确认将「${item.name}」报废吗？\n报废后该物品将不再可用。`
      )
    )
      return;

    setDiscarding(true);
    const { error: discardError } = await supabase
      .from("items")
      .update({ status: "报废" })
      .eq("id", item.id);
    setDiscarding(false);

    if (discardError) {
      window.alert("报废失败：" + discardError.message);
      return;
    }

    router.refresh();
  };

  const handleReturn = async () => {
    if (!window.confirm(`确认归还「${item.name}」吗？`)) return;

    setReturning(true);

    // Step 1: 把该物品所有"未归还"的借出记录的 returned_at 设为当前时间
    const { error: returnError } = await supabase
      .from("borrow_history")
      .update({ returned_at: new Date().toISOString() })
      .eq("item_id", item.id)
      .is("returned_at", null);

    if (returnError) {
      setReturning(false);
      window.alert("更新归还时间失败：" + returnError.message);
      return;
    }

    // Step 2: 把物品状态改回 "可用"
    const { error: statusError } = await supabase
      .from("items")
      .update({ status: "可用" })
      .eq("id", item.id);

    setReturning(false);

    if (statusError) {
      window.alert("更新物品状态失败：" + statusError.message);
      return;
    }

    router.refresh();
  };

  const handleDelete = async () => {
    const ok = window.confirm(
      `确定要删除物品「${item.name}」吗？\n该物品的所有借出历史也会一起被删除，此操作不可撤销。`
    );
    if (!ok) return;

    setDeleting(true);
    const { error: deleteError } = await supabase
      .from("items")
      .delete()
      .eq("id", item.id);
    setDeleting(false);

    if (deleteError) {
      window.alert("删除失败：" + deleteError.message);
      return;
    }

    router.refresh();
  };

  const handleSave = async () => {
    setError(null);

    if (!name.trim()) {
      setError("名称必填");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase
      .from("items")
      .update({
        name: name.trim(),
        category: category.trim() || null,
        code: code.trim() || null,
        status,
      })
      .eq("id", item.id);
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setEditing(false);
    router.refresh();
  };

  const handleCancel = () => {
    setName(item.name);
    setCategory(item.category ?? "");
    setCode(item.code ?? "");
    setStatus(item.status);
    setError(null);
    setEditing(false);
  };

  if (editing) {
    return (
      <tr style={{ borderTop: "1px solid #f3f4f6", background: "#fffbeb" }}>
        <td style={td}>{item.id}</td>
        <td style={td}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </td>
        <td style={td}>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={inputStyle}
          />
        </td>
        <td style={td}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={inputStyle}
          />
        </td>
        <td style={td}>
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
            <div
              style={{ color: "#991b1b", fontSize: "12px", marginTop: "4px" }}
            >
              {error}
            </div>
          )}
        </td>
      </tr>
    );
  }

  const historyCount = item.borrow_history?.length ?? 0;

  return (
    <>
      <tr style={{ borderTop: "1px solid #f3f4f6" }}>
        <td style={td}>{item.id}</td>
        <td style={{ ...td, fontWeight: 600 }}>{item.name}</td>
        <td style={td}>{item.category ?? "—"}</td>
        <td style={{ ...td, color: "#6b7280" }}>{item.code ?? "—"}</td>
        <td style={td}>
          <StatusBadge status={item.status} />
        </td>
        <td style={td}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {item.status === "可用" && (
              <button
                onClick={() => setBorrowing(true)}
                style={primaryBtn}
              >
                借出
              </button>
            )}
            {item.status === "借出中" && (
              <button
                onClick={handleReturn}
                disabled={returning}
                style={successBtn}
              >
                {returning ? "处理中..." : "归还"}
              </button>
            )}
            {(item.status === "可用" || item.status === "维修中") && (
              <button
                onClick={handleDiscard}
                disabled={discarding}
                style={discardBtn}
              >
                {discarding ? "处理中..." : "🗑️ 报废"}
              </button>
            )}
            <button
              onClick={() => setShowHistory((v) => !v)}
              style={secondaryBtn}
            >
              {showHistory ? "▼ 历史" : `▶ 历史(${historyCount})`}
            </button>
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
      {borrowing && (
        <tr>
          <td colSpan={6} style={{ padding: 0 }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleBorrowSubmit();
              }}
              style={{
                padding: "16px 20px",
                background: "#eff6ff",
                borderTop: "1px solid #dbeafe",
              }}
            >
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1e40af",
                  marginBottom: "10px",
                }}
              >
                借出 「{item.name}」
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <label style={subLabel}>
                  借出人 <span style={{ color: "#ef4444" }}>*</span>
                  <input
                    value={borrower}
                    onChange={(e) => setBorrower(e.target.value)}
                    style={inputStyle}
                    placeholder="例：杨紫璇"
                    autoFocus
                  />
                </label>
                <label style={subLabel}>
                  备注
                  <input
                    value={borrowNotes}
                    onChange={(e) => setBorrowNotes(e.target.value)}
                    style={inputStyle}
                    placeholder="例：远程办公使用"
                  />
                </label>
              </div>
              {borrowError && (
                <div
                  style={{
                    color: "#991b1b",
                    fontSize: "12px",
                    marginBottom: "8px",
                  }}
                >
                  {borrowError}
                </div>
              )}
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="submit"
                  disabled={borrowSubmitting}
                  style={primaryBtn}
                >
                  {borrowSubmitting ? "处理中..." : "确认借出"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBorrower("");
                    setBorrowNotes("");
                    setBorrowError(null);
                    setBorrowing(false);
                  }}
                  style={secondaryBtn}
                >
                  取消
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}
      {showHistory && (
        <tr>
          <td colSpan={6} style={{ padding: 0 }}>
            <HistoryPanel history={item.borrow_history ?? []} />
          </td>
        </tr>
      )}
    </>
  );
}

const subLabel: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  fontSize: "12px",
  color: "#1e3a8a",
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

const successBtn: React.CSSProperties = {
  padding: "6px 12px",
  background: "#10b981",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 500,
};

const discardBtn: React.CSSProperties = {
  padding: "6px 12px",
  background: "#6b7280",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 500,
};

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
  background: "white",
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
