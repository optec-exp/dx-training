"use client";
import { useState } from "react";

interface ActionItem {
  task: string;
  owner: string;
  due: string;
}

export default function Home() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [attendees, setAttendees] = useState("");
  const [agenda, setAgenda] = useState("");
  const [decisions, setDecisions] = useState("");
  const [actionItems, setActionItems] = useState<ActionItem[]>([{ task: "", owner: "", due: "" }]);
  const [nextMeeting, setNextMeeting] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const addAction = () => setActionItems(prev => [...prev, { task: "", owner: "", due: "" }]);
  const removeAction = (i: number) => setActionItems(prev => prev.filter((_, idx) => idx !== i));
  const updateAction = (i: number, field: keyof ActionItem, val: string) => {
    setActionItems(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
  };

  const handleSave = async () => {
    if (!title) { setError("请填写会议名称"); return; }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date, title, location, attendees, agenda, decisions,
          action_items: actionItems.filter(a => a.task),
          next_meeting: nextMeeting,
        }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else { setSaved(true); }
    } catch {
      setError("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8 print:shadow-none print:rounded-none">
        <div className="flex justify-between items-start mb-6 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">会议记录整理</h1>
            <p className="text-sm text-gray-500 mt-1">填写会议内容后保存到 Kintone 并可打印</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm">
              打印
            </button>
            <button
              onClick={handleSave} disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2 rounded-lg text-sm font-medium"
            >
              {saving ? "保存中..." : "保存到 Kintone"}
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 print:hidden">{error}</p>}
        {saved && <p className="text-green-600 text-sm mb-4 print:hidden">✓ 已成功保存到 Kintone</p>}

        {/* 基本信息 */}
        <div className="print:border-b print:border-gray-300 print:pb-4 print:mb-4">
          <h2 className="text-xl font-bold text-gray-800 print:block hidden">{title || "会议记录"}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">会议日期</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none print:border-0 print:p-0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">会议场所</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              placeholder="会議室A / Teams"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none" />
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">会议名称</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="月次定例ミーティング"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none" />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">出席者</label>
          <input type="text" value={attendees} onChange={e => setAttendees(e.target.value)}
            placeholder="田中, 鈴木, 佐藤（用逗号分隔）"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none" />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">讨论内容 / 议事</label>
          <textarea value={agenda} onChange={e => setAgenda(e.target.value)}
            placeholder="1. 先月の振り返り&#10;2. 今月の目標確認&#10;3. 課題の共有"
            rows={4}
            className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">决议事项</label>
          <textarea value={decisions} onChange={e => setDecisions(e.target.value)}
            placeholder="・予算案を承認&#10;・新規施策を来月から開始"
            rows={3}
            className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>

        {/* 行动项 */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">行动项（Action Items）</label>
            <button onClick={addAction} className="text-sm text-blue-600 hover:underline print:hidden">+ 追加</button>
          </div>
          <div className="space-y-2">
            {actionItems.map((a, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" value={a.task} onChange={e => updateAction(i, "task", e.target.value)}
                  placeholder="タスク内容"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <input type="text" value={a.owner} onChange={e => updateAction(i, "owner", e.target.value)}
                  placeholder="担当"
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <input type="date" value={a.due} onChange={e => updateAction(i, "due", e.target.value)}
                  className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                {actionItems.length > 1 && (
                  <button onClick={() => removeAction(i)} className="text-red-400 hover:text-red-600 text-sm print:hidden">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">下次会议</label>
          <input type="text" value={nextMeeting} onChange={e => setNextMeeting(e.target.value)}
            placeholder="来月第2火曜日 14:00〜"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none" />
        </div>

        <p className="text-xs text-gray-400 text-right mt-4">记录时间：{new Date().toLocaleString("zh-CN")}</p>
      </div>
    </main>
  );
}
