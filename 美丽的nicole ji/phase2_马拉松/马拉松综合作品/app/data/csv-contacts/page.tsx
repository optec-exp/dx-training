"use client";
import { useState, useRef } from "react";

type Row = Record<string, string>;

function parseCSV(text: string): { headers: string[]; rows: Row[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  // BOM除去
  const headerLine = lines[0].replace(/^\uFEFF/, "");
  const headers = headerLine.split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row: Row = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return row;
  });
  return { headers, rows };
}

export default function CsvContactsPage() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError("");
    const text = await file.text();
    const { headers: h, rows: r } = parseCSV(text);
    if (r.length === 0) { setError("CSV 文件为空或格式不正确"); return; }
    setHeaders(h);
    setRows(r);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult({ success: data.success, failed: data.failed });
    } catch {
      setError("导入失败");
    } finally {
      setImporting(false);
    }
  };

  return (
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">CSV 联系人导入 Kintone</h1>
        <p className="text-sm text-gray-500 mb-6">上传 CSV 文件，预览联系人后批量导入到 Kintone 联系人 App</p>

        {/* 文件上传 */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition mb-6"
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          {fileName ? (
            <div>
              <p className="text-blue-600 font-medium text-lg">📋 {fileName}</p>
              <p className="text-sm text-gray-400 mt-1">{rows.length} 位联系人已读取</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-400 text-lg">点击选择 CSV 文件</p>
              <p className="text-xs text-gray-300 mt-1">UTF-8 或 Shift-JIS 编码，第一行为表头</p>
            </div>
          )}
        </div>

        {/* CSV格式提示 */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-600">
          <p className="font-medium mb-1">CSV 表头示例（字段名需与 Kintone 字段编码一致）：</p>
          <p className="font-mono">company_name,contact_name,email,phone,department</p>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {rows.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium text-gray-700">
                预览（前 5 行，共 {rows.length} 行）
              </p>
              <button
                onClick={handleImport} disabled={importing}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-6 py-2 rounded-lg text-sm font-medium"
              >
                {importing ? "导入中..." : `导入全部 ${rows.length} 条联系人`}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600">
                    {headers.map(h => (
                      <th key={h} className="text-left p-2 border border-gray-200 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {headers.map(h => (
                        <td key={h} className="p-2 border border-gray-200 max-w-[150px] truncate">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {result && (
          <div className="mt-6 flex gap-4">
            <div className="bg-green-50 rounded-xl px-6 py-4 text-center flex-1">
              <p className="text-3xl font-bold text-green-600">{result.success}</p>
              <p className="text-sm text-green-400">导入成功</p>
            </div>
            <div className="bg-red-50 rounded-xl px-6 py-4 text-center flex-1">
              <p className="text-3xl font-bold text-red-600">{result.failed}</p>
              <p className="text-sm text-red-400">导入失败</p>
            </div>
          </div>
        )}
      </div>
  );
}
