"use client";
import { useState, useRef } from "react";

type Row = Record<string, string>;

export default function ExcelImportPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // 客户端解析Excel（使用xlsx库）
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError("");

    const buf = await file.arrayBuffer();
    // 动态import xlsx避免SSR问题
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data: Row[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
    if (data.length > 0) {
      setHeaders(Object.keys(data[0]));
      setRows(data);
    } else {
      setError("Excel 文件为空或格式不正确");
    }
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult({ success: data.success, failed: data.failed });
    } catch {
      setError("导入失败，请检查网络连接");
    } finally {
      setImporting(false);
    }
  };

  return (
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Excel 导入 Kintone</h1>
        <p className="text-sm text-gray-500 mb-6">上传 Excel 文件，预览内容后批量导入到 Kintone</p>

        {/* 文件上传 */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition mb-6"
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          {fileName ? (
            <div>
              <p className="text-blue-600 font-medium text-lg">📄 {fileName}</p>
              <p className="text-sm text-gray-400 mt-1">{rows.length} 行数据已读取</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-400 text-lg">点击选择 Excel 文件</p>
              <p className="text-xs text-gray-300 mt-1">支持 .xlsx / .xls</p>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* 预览表格 */}
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
                {importing ? `导入中...` : `导入全部 ${rows.length} 行`}
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
            {rows.length > 5 && (
              <p className="text-xs text-gray-400 mt-2 text-right">…还有 {rows.length - 5} 行</p>
            )}
          </>
        )}

        {/* 导入结果 */}
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
        <p className="text-xs text-gray-400 mt-6 text-right">
          目标：Kintone App {process.env.NEXT_PUBLIC_APP_ID || "（设置环境变量）"}
        </p>
      </div>
  );
}
