"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---------- 类型定义 ----------
type ItemStatus = "available" | "borrowed" | "repair" | "retired";

type Item = {
  id: number;
  name: string;
  category: string;
  status: ItemStatus;
  created_at: string;
};

type BorrowRecord = {
  id: number;
  item_id: number;
  borrower_name: string;
  borrowed_at: string;
  returned_at: string | null;
};

// ---------- 常量 ----------
const STATUS_LABELS: Record<ItemStatus, string> = {
  available: "可用",
  borrowed: "借出中",
  repair: "维修中",
  retired: "报废",
};

const STATUS_COLORS: Record<ItemStatus, string> = {
  available: "bg-green-100 text-green-800",
  borrowed: "bg-blue-100 text-blue-800",
  repair: "bg-yellow-100 text-yellow-800",
  retired: "bg-gray-100 text-gray-500",
};

const CATEGORIES = ["PC", "显示器", "键盘", "鼠标", "其他"];

const FILTER_TABS = [
  { key: "all", label: "全部" },
  { key: "available", label: "可用" },
  { key: "borrowed", label: "借出中" },
  { key: "repair", label: "维修中" },
  { key: "retired", label: "报废" },
];

// ---------- 日期格式化 ----------
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "PC" });
  const [borrowerName, setBorrowerName] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ---------- データ取得 ----------
  const fetchItems = async () => {
    const { data } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  const fetchBorrowRecords = async (itemId: number) => {
    const { data } = await supabase
      .from("borrow_records")
      .select("*")
      .eq("item_id", itemId)
      .order("borrowed_at", { ascending: false });
    if (data) setBorrowRecords(data);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // ---------- 提示消息 ----------
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // ---------- 选择物品 ----------
  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    setShowBorrowForm(false);
    setBorrowerName("");
    fetchBorrowRecords(item.id);
  };

  // ---------- 登记新物品 ----------
  const handleAddItem = async () => {
    if (!newItem.name.trim()) {
      showMessage("请输入物品名称");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("items").insert({
      name: newItem.name.trim(),
      category: newItem.category,
      status: "available",
    });
    if (error) {
      showMessage("登记失败：" + error.message);
    } else {
      showMessage("登记成功！");
      setNewItem({ name: "", category: "PC" });
      setShowAddForm(false);
      fetchItems();
    }
    setLoading(false);
  };

  // ---------- 借出 ----------
  const handleBorrow = async () => {
    if (!selectedItem || !borrowerName.trim()) {
      showMessage("请输入借出人姓名");
      return;
    }
    setLoading(true);

    // 1. 写入借出记录
    const { error: recError } = await supabase.from("borrow_records").insert({
      item_id: selectedItem.id,
      borrower_name: borrowerName.trim(),
    });
    if (recError) {
      showMessage("操作失败：" + recError.message);
      setLoading(false);
      return;
    }

    // 2. 更新物品状态
    const { error: itemError } = await supabase
      .from("items")
      .update({ status: "borrowed" })
      .eq("id", selectedItem.id);
    if (itemError) {
      showMessage("状态更新失败：" + itemError.message);
    } else {
      showMessage("借出成功！");
      setShowBorrowForm(false);
      setBorrowerName("");
      const updated: Item = { ...selectedItem, status: "borrowed" };
      setSelectedItem(updated);
      await fetchItems();
      fetchBorrowRecords(selectedItem.id);
    }
    setLoading(false);
  };

  // ---------- 归还 ----------
  const handleReturn = async () => {
    if (!selectedItem) return;
    setLoading(true);

    // 找到未归还的记录
    const activeRecord = borrowRecords.find((r) => !r.returned_at);
    if (activeRecord) {
      await supabase
        .from("borrow_records")
        .update({ returned_at: new Date().toISOString() })
        .eq("id", activeRecord.id);
    }

    const { error } = await supabase
      .from("items")
      .update({ status: "available" })
      .eq("id", selectedItem.id);
    if (error) {
      showMessage("归还失败：" + error.message);
    } else {
      showMessage("归还成功！");
      const updated: Item = { ...selectedItem, status: "available" };
      setSelectedItem(updated);
      await fetchItems();
      fetchBorrowRecords(selectedItem.id);
    }
    setLoading(false);
  };

  // ---------- 更新状态（维修/报废/恢复）----------
  const handleUpdateStatus = async (newStatus: ItemStatus) => {
    if (!selectedItem) return;
    setLoading(true);
    const { error } = await supabase
      .from("items")
      .update({ status: newStatus })
      .eq("id", selectedItem.id);
    if (error) {
      showMessage("更新失败：" + error.message);
    } else {
      const labels: Record<string, string> = {
        repair: "已标记为维修中",
        retired: "已标记为报废",
        available: "已恢复为可用",
      };
      showMessage(labels[newStatus] ?? "更新成功");
      const updated: Item = { ...selectedItem, status: newStatus };
      setSelectedItem(updated);
      await fetchItems();
    }
    setLoading(false);
  };

  // ---------- 过滤 ----------
  const filteredItems =
    filter === "all" ? items : items.filter((i) => i.status === filter);

  const countByStatus = (key: string) =>
    key === "all" ? items.length : items.filter((i) => i.status === key).length;

  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">物品管理</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            ＋ 登记新物品
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* 提示消息 */}
        {message && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
            {message}
          </div>
        )}

        {/* 登记表单 */}
        {showAddForm && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-700 mb-4">登记新物品</h2>
            <div className="flex gap-3 flex-wrap">
              <input
                type="text"
                placeholder="物品名称"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-40"
              />
              <select
                value={newItem.category}
                onChange={(e) =>
                  setNewItem({ ...newItem, category: e.target.value })
                }
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddItem}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                登记
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-100"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* 左：物品列表 */}
          <div className="flex-1 min-w-0">
            {/* 过滤标签 */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    filter === tab.key
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                  <span className="ml-1 text-xs opacity-70">
                    ({countByStatus(tab.key)})
                  </span>
                </button>
              ))}
            </div>

            {/* 物品列表 */}
            <div className="space-y-2">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400">暂无物品</div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`bg-white border rounded-xl px-4 py-3 cursor-pointer hover:border-blue-300 transition-colors ${
                      selectedItem?.id === item.id
                        ? "border-blue-500 shadow-sm"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.category}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[item.status as ItemStatus]}`}
                      >
                        {STATUS_LABELS[item.status as ItemStatus]}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 右：详情 & 操作 & 历史 */}
          {selectedItem && (
            <div className="w-72 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                {/* 物品信息 */}
                <h2 className="font-semibold text-gray-800 mb-1">
                  {selectedItem.name}
                </h2>
                <p className="text-sm text-gray-400 mb-3">
                  {selectedItem.category}
                </p>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[selectedItem.status]}`}
                >
                  {STATUS_LABELS[selectedItem.status]}
                </span>

                {/* 操作按钮 */}
                <div className="mt-4 space-y-2">
                  {/* 可用状态 */}
                  {selectedItem.status === "available" && (
                    <>
                      {!showBorrowForm ? (
                        <button
                          onClick={() => setShowBorrowForm(true)}
                          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700"
                        >
                          借出
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="借出人姓名"
                            value={borrowerName}
                            onChange={(e) => setBorrowerName(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleBorrow()
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleBorrow}
                              disabled={loading}
                              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                              确认借出
                            </button>
                            <button
                              onClick={() => {
                                setShowBorrowForm(false);
                                setBorrowerName("");
                              }}
                              className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-200"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => handleUpdateStatus("repair")}
                        disabled={loading}
                        className="w-full bg-yellow-50 text-yellow-700 border border-yellow-200 py-2 rounded-lg text-sm hover:bg-yellow-100"
                      >
                        标记为维修中
                      </button>
                      <button
                        onClick={() => handleUpdateStatus("retired")}
                        disabled={loading}
                        className="w-full bg-gray-50 text-gray-500 border border-gray-200 py-2 rounded-lg text-sm hover:bg-gray-100"
                      >
                        报废
                      </button>
                    </>
                  )}

                  {/* 借出中状态 */}
                  {selectedItem.status === "borrowed" && (
                    <button
                      onClick={handleReturn}
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      归还
                    </button>
                  )}

                  {/* 维修中状态 */}
                  {selectedItem.status === "repair" && (
                    <button
                      onClick={() => handleUpdateStatus("available")}
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      维修完成，恢复可用
                    </button>
                  )}

                  {/* 报废状态 */}
                  {selectedItem.status === "retired" && (
                    <p className="text-center text-xs text-gray-400 py-2">
                      此物品已报废
                    </p>
                  )}
                </div>

                {/* 借出历史 */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">
                    借出历史
                  </h3>
                  {borrowRecords.length === 0 ? (
                    <p className="text-xs text-gray-400">暂无借出记录</p>
                  ) : (
                    <div className="space-y-2">
                      {borrowRecords.map((record) => (
                        <div
                          key={record.id}
                          className="bg-gray-50 rounded-lg p-3 text-xs"
                        >
                          <p className="font-medium text-gray-700">
                            {record.borrower_name}
                          </p>
                          <p className="text-gray-400 mt-0.5">
                            借出：{formatDate(record.borrowed_at)}
                          </p>
                          {record.returned_at ? (
                            <p className="text-gray-400">
                              归还：{formatDate(record.returned_at)}
                            </p>
                          ) : (
                            <p className="text-blue-500 font-medium mt-0.5">
                              借出中
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
