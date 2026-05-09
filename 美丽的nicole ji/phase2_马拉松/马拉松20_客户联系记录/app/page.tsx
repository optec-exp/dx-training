"use client";
import { useState, useEffect } from "react";

interface ContactLog {
  id: string;
  contact_date: string;
  company_name: string;
  contact_name: string;
  contact_type: string;
  content: string;
  next_action: string;
  next_date: string;
}

const CONTACT_TYPES = ["电话", "邮件", "面谈", "视频会议", "LINE", "其他"];

export default function Home() {
  const [logs, setLogs] = useState<ContactLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 表单状态
  const [form, setForm] = useState({
    contact_date: new Date().toISOString().slice(0, 10),
    company_name: "",
    contact_name: "",
    contact_type: CONTACT_TYPES[0],
    content: "",
    next_action: "",
    next_date: "",
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/log");
      const data = await res.json();
      if (data.error) setError(data.error);
      else setLogs(data.logs ?? []);
    } catch {
      setError("获取记录失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleSave = async () => {
    if (!form.company_name || !form.content) {
      setError("请填写客户名和联系内容");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setShowForm(false);
        setForm({
          contact_date: new Date().toISOString().slice(0, 10),
          company_name: "", contact_name: "",
          contact_type: CONTACT_TYPES[0],
          content: "", next_action: "", next_date: "",
        });
        await fetchLogs();
      }
    } catch {
      setError("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const typeBadge = (t: string) => {
    const colors: Record<string, string> = {
      "电话": "bg-blue-100 text-blue-700",
      "邮件": "bg-purple-100 text-purple-700",
      "面谈": "bg-green-100 text-green-700",
      "视频会议": "bg-teal-100 text-teal-700",
      "LINE": "bg-lime-100 text-lime-700",
      "其他": "bg-gray-100 text-gray-600",
    };
    return colors[t] ?? "bg-gray-100 text-gray-600";
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">客户联系记录</h1>
            <p className="text-sm text-gray-500 mt-1">记录与客户的沟通历史，保存到 Kintone</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError(""); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium"
          >
            {showForm ? "取消" : "+ 新增联系记录"}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* 新增表单 */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6 border-l-4 border-blue-500">
            <h2 className="text-base font-bold text-gray-800 mb-4">新增联系记录</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">联系日期</label>
                <input type="date" value={form.contact_date}
                  onChange={e => setForm(f => ({ ...f, contact_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">联系方式</label>
                <select value={form.contact_type}
                  onChange={e => setForm(f => ({ ...f, contact_type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  {CONTACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">客户公司名</label>
                <input type="text" value={form.company_name}
                  onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  placeholder="株式会社〇〇〇"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">联系人姓名</label>
                <input type="text" value={form.contact_name}
                  onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                  placeholder="田中 太郎"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">联系内容</label>
              <textarea value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="今日の商談内容、相手の反応、決まったことなど"
                rows={3}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">下一步行动</label>
                <input type="text" value={form.next_action}
                  onChange={e => setForm(f => ({ ...f, next_action: e.target.value }))}
                  placeholder="提案書を送付する"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">下次联系日期</label>
                <input type="date" value={form.next_date}
                  onChange={e => setForm(f => ({ ...f, next_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
            <button
              onClick={handleSave} disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2.5 rounded-xl font-medium text-sm"
            >
              {saving ? "保存中..." : "保存到 Kintone"}
            </button>
          </div>
        )}

        {/* 记录列表 */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <p className="font-medium text-gray-700">联系历史记录（{logs.length} 件）</p>
            <button onClick={fetchLogs} className="text-xs text-blue-500 hover:underline">刷新</button>
          </div>

          {loading && <p className="text-center py-8 text-gray-400">加载中...</p>}
          {!loading && logs.length === 0 && (
            <p className="text-center py-8 text-gray-400">暂无联系记录</p>
          )}
          {!loading && logs.length > 0 && (
            <div className="divide-y divide-gray-100">
              {logs.map((log, i) => (
                <div key={i} className="p-5 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge(log.contact_type)}`}>
                        {log.contact_type}
                      </span>
                      <span className="font-bold text-gray-800">{log.company_name}</span>
                      {log.contact_name && <span className="text-sm text-gray-500">/ {log.contact_name}</span>}
                    </div>
                    <span className="text-xs text-gray-400">{log.contact_date}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{log.content}</p>
                  {log.next_action && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                      <span>→ 次のアクション：{log.next_action}</span>
                      {log.next_date && <span className="text-blue-400">（{log.next_date}）</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
