"use client";
import { useState, useEffect } from "react";

interface Client {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
}

const TEMPLATES = [
  {
    id: "greeting",
    name: "定期ご挨拶",
    subject: "いつもお世話になっております",
    body: `{{contact_name}} 様

お世話になっております。
{{company}} の担当者でございます。

平素より格別のご高配を賜り、誠にありがとうございます。

今後ともどうぞよろしくお願いいたします。

{{today}}
`,
  },
  {
    id: "followup",
    name: "案件跟进",
    subject: "案件フォローアップのご連絡",
    body: `{{contact_name}} 様

お世話になっております。

先日ご相談いただいた件について、進捗をご報告させていただきます。

現在、鋭意対応中でございます。
ご不明な点がございましたら、お気軽にご連絡ください。

何卒よろしくお願いいたします。

{{today}}
`,
  },
  {
    id: "thanks",
    name: "感谢邮件",
    subject: "ご契約いただきありがとうございます",
    body: `{{contact_name}} 様

この度はご契約いただき、誠にありがとうございます。

今後ともご支援のほど、よろしくお願いいたします。
ご不明な点がございましたら、いつでもお問い合わせください。

{{today}}
`,
  },
  {
    id: "payment",
    name: "付款提醒",
    subject: "お支払いのご確認のお願い",
    body: `{{contact_name}} 様

お世話になっております。

誠に恐れ入りますが、下記のお支払いについてご確認をお願いいたします。

ご確認の上、期日までにご対応いただけますと幸いです。
ご不明点がございましたら、お気軽にご連絡ください。

{{today}}
`,
  },
];

export default function EmailTemplatePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [emailBody, setEmailBody] = useState("");
  const [subject, setSubject] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/clients")
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setClients(d.clients ?? []); })
      .catch(() => setError("获取客户列表失败"))
      .finally(() => setLoading(false));
  }, []);

  const generate = (client: Client, tid: string) => {
    const tmpl = TEMPLATES.find(t => t.id === tid)!;
    const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
    const filled = tmpl.body
      .replace(/\{\{contact_name\}\}/g, client.contact_name || client.company_name)
      .replace(/\{\{company\}\}/g, client.company_name)
      .replace(/\{\{today\}\}/g, today);
    setEmailBody(filled);
    setSubject(tmpl.subject);
  };

  const handleClientChange = (id: string) => {
    const c = clients.find(c => c.id === id) ?? null;
    setSelectedClient(c);
    if (c) generate(c, templateId);
  };

  const handleTemplateChange = (tid: string) => {
    setTemplateId(tid);
    if (selectedClient) generate(selectedClient, tid);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">邮件模板填充</h1>
        <p className="text-sm text-gray-500 mb-6">选择客户和模板，自动生成填充好的邮件正文</p>

        {loading && <p className="text-gray-400 text-center py-4">加载客户列表...</p>}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {!loading && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* 选择客户 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">客户</label>
              <select
                onChange={e => handleClientChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              >
                <option value="">-- 选择客户 --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}（{c.contact_name}）</option>
                ))}
              </select>
            </div>
            {/* 选择模板 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮件模板</label>
              <select
                value={templateId}
                onChange={e => handleTemplateChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              >
                {TEMPLATES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {emailBody && (
          <div className="space-y-4">
            {/* 件名 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">件名</label>
                <button
                  onClick={() => copy(subject)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  复制
                </button>
              </div>
              <input
                type="text" value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
              />
            </div>

            {/* 正文 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">邮件正文</label>
                <button
                  onClick={() => copy(emailBody)}
                  className={`text-sm px-4 py-1.5 rounded-lg font-medium transition ${
                    copied ? "bg-green-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {copied ? "已复制！" : "复制全文"}
                </button>
              </div>
              <textarea
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                rows={14}
                className="w-full border border-gray-300 rounded-xl p-4 text-sm font-mono text-gray-800 bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {selectedClient?.email && (
              <p className="text-xs text-gray-400">
                发送至：<span className="text-blue-500">{selectedClient.email}</span>
              </p>
            )}
          </div>
        )}
      </div>
  );
}
