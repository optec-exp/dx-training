"use client";
import { useState } from "react";

interface Form {
  flight_no: string; origin: string; destination: string;
  scheduled: string; actual: string; reason: string;
  cargo: string; handler: string; remarks: string;
}

export default function DelayReportPage() {
  const [form, setForm] = useState<Form>({
    flight_no: "", origin: "", destination: "",
    scheduled: "", actual: "", reason: "",
    cargo: "", handler: "", remarks: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const update = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const delayMinutes = () => {
    if (!form.scheduled || !form.actual) return null;
    const diff = (new Date(form.actual).getTime() - new Date(form.scheduled).getTime()) / 60000;
    return Math.round(diff);
  };

  const today = new Date().toLocaleDateString("zh-CN");
  const delay = delayMinutes();

  return (
      <div className="max-w-3xl mx-auto">
        {!submitted ? (
          <div className="bg-white rounded-2xl shadow p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">航班延误报告书</h1>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["航班号", "flight_no", "例：CA1234"],
                ["出发地", "origin", "例：上海浦东"],
                ["目的地", "destination", "例：东京成田"],
                ["原定起飞时间", "scheduled", ""],
                ["实际起飞时间", "actual", ""],
                ["担当者", "handler", "例：Nicole Ji"],
              ].map(([label, key, ph]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={key === "scheduled" || key === "actual" ? "datetime-local" : "text"}
                    value={form[key as keyof Form]} onChange={update(key as keyof Form)}
                    placeholder={ph}
                    className="w-full border border-gray-400 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">延误原因</label>
                <select value={form.reason} onChange={update("reason")}
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400">
                  <option value="">-- 选择原因 --</option>
                  <option>天气原因</option><option>机械故障</option><option>管制原因</option>
                  <option>前序航班延误</option><option>旅客原因</option><option>其他</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">影响货物</label>
                <input value={form.cargo} onChange={update("cargo")} placeholder="例：电子零件 5箱 / AWB 123-45678901"
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea value={form.remarks} onChange={update("remarks")} rows={3} placeholder="客户已告知 / 重新安排航班等"
                  className="w-full border border-gray-400 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
            </div>
            <button onClick={() => setSubmitted(true)}
              className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg">
              生成报告书
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">航班延误报告书</h1>
                <p className="text-sm text-gray-500">作成日：{today}</p>
              </div>
              <div className="flex gap-2 print:hidden">
                <button onClick={() => setSubmitted(false)}
                  className="border border-gray-400 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                  返回修改
                </button>
                <button onClick={() => window.print()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                  打印 / PDF
                </button>
              </div>
            </div>

            {delay !== null && delay > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
                <p className="text-3xl font-bold text-red-600">{delay} 分钟</p>
                <p className="text-sm text-red-500">延误时间</p>
              </div>
            )}

            <table className="w-full text-sm border-collapse mb-4">
              <tbody>
                {[
                  ["航班号", form.flight_no],
                  ["出发地 → 目的地", `${form.origin} → ${form.destination}`],
                  ["原定起飞时间", form.scheduled?.replace("T", " ")],
                  ["实际起飞时间", form.actual?.replace("T", " ")],
                  ["延误时间", delay !== null ? `${delay} 分钟` : "-"],
                  ["延误原因", form.reason],
                  ["影响货物", form.cargo],
                  ["担当者", form.handler],
                  ["备注", form.remarks],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-gray-200">
                    <td className="p-3 bg-gray-50 font-medium text-gray-600 w-1/3">{k}</td>
                    <td className="p-3 text-gray-900">{v || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 text-right" suppressHydrationWarning>生成时间：{new Date().toLocaleString("zh-CN")}</p>
          </div>
        )}
      </div>
  );
}
