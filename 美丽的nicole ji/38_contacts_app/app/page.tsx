"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ① Supabase クライアントを .env.local の値で初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ② 社員の型定義
type Employee = {
  id: number;
  name: string;
  email: string;
  department: string;
  phone: string;
  created_at: string;
};

// フォームの初期値
const emptyForm = { name: "", email: "", department: "", phone: "" };

export default function ContactsApp() {
  // ③ 状態管理
  const [employees, setEmployees] = useState<Employee[]>([]);   // 全社員リスト
  const [filtered, setFiltered] = useState<Employee[]>([]);     // 検索後のリスト
  const [search, setSearch] = useState("");                      // 検索キーワード
  const [form, setForm] = useState(emptyForm);                   // フォーム入力値
  const [editId, setEditId] = useState<number | null>(null);    // 編集中の社員ID
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  // ④ 初期読み込み：全社員を取得（SELECT）
  useEffect(() => {
    fetchEmployees();
  }, []);

  // 検索キーワードが変わったらリストを絞り込む
  useEffect(() => {
    const kw = search.toLowerCase();
    setFiltered(
      employees.filter(
        (e) =>
          e.name.toLowerCase().includes(kw) ||
          e.department.toLowerCase().includes(kw) ||
          e.email.toLowerCase().includes(kw)
      )
    );
  }, [search, employees]);

  // ⑤ SELECT：全社員取得
  async function fetchEmployees() {
    setLoading(true);
    const { data, error } = await supabase
      .from("employee")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("データ取得に失敗しました: " + error.message);
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  }

  // ⑥ INSERT / UPDATE：保存ボタン
  async function handleSave() {
    if (!form.name.trim()) {
      setError("氏名は必須です");
      return;
    }
    setError("");
    setLoading(true);

    if (editId === null) {
      // 新規追加（INSERT）
      const { error } = await supabase.from("employee").insert([form]);
      if (error) setError("追加に失敗しました: " + error.message);
    } else {
      // 更新（UPDATE）
      const { error } = await supabase
        .from("employee")
        .update(form)
        .eq("id", editId);
      if (error) setError("更新に失敗しました: " + error.message);
    }

    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
    await fetchEmployees();
    setLoading(false);
  }

  // ⑦ DELETE：削除ボタン
  async function handleDelete(id: number, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    setLoading(true);
    const { error } = await supabase.from("employee").delete().eq("id", id);
    if (error) setError("削除に失敗しました: " + error.message);
    await fetchEmployees();
    setLoading(false);
  }

  // 編集ボタン：フォームに選択した社員のデータをセット
  function handleEdit(emp: Employee) {
    setForm({
      name: emp.name,
      email: emp.email,
      department: emp.department,
      phone: emp.phone,
    });
    setEditId(emp.id);
    setShowForm(true);
    setError("");
  }

  // 新規追加ボタン：フォームをリセット
  function handleNew() {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
    setError("");
  }

  // 部署ごとの色
  const deptColor: Record<string, string> = {
    営業: "bg-blue-100 text-blue-800",
    経理: "bg-green-100 text-green-800",
    総務: "bg-purple-100 text-purple-800",
    物流: "bg-orange-100 text-orange-800",
    IT: "bg-cyan-100 text-cyan-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-blue-700 text-white shadow">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📋 社内通讯录</h1>
            <p className="text-blue-200 text-sm mt-0.5">员工信息管理系统</p>
          </div>
          <button
            onClick={handleNew}
            className="bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition text-sm"
          >
            ＋ 新增员工
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* 新規追加 / 編集フォーム */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editId === null ? "➕ 新增员工" : "✏️ 编辑员工信息"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例：山田 太郎"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="例：yamada@optec.co.jp"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  部门
                </label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                  placeholder="例：営業 / 経理 / 物流"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  电话
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="例：090-1234-5678"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? "保存中..." : "💾 保存"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyForm);
                  setEditId(null);
                  setError("");
                }}
                className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 検索バー */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 flex items-center gap-3">
          <span className="text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="按姓名、部门、邮箱搜索..."
            className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* 統計 */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>共 <strong className="text-gray-800">{employees.length}</strong> 名员工</span>
          {search && (
            <span>，搜索结果 <strong className="text-blue-600">{filtered.length}</strong> 名</span>
          )}
          {loading && <span className="text-blue-500">加载中...</span>}
        </div>

        {/* 社員リスト */}
        {filtered.length === 0 && !loading ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">👤</p>
            <p className="text-sm">
              {search ? "未找到匹配的员工" : "暂无员工记录，点击「新增员工」开始添加"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">姓名</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">部门</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 hidden sm:table-cell">邮箱</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">电话</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {emp.name.charAt(0)}
                        </span>
                        {emp.name}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {emp.department ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            deptColor[emp.department] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {emp.department}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 hidden sm:table-cell">
                      {emp.email || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-600 hidden md:table-cell">
                      {emp.phone || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(emp)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, emp.name)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
