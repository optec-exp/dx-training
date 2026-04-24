'use client';
import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div>
      <section className="bg-[#0f2557] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-3">联系我们</h1>
          <p className="text-blue-200">欢迎随时咨询货运相关问题，我们将尽快回复</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">

          {/* Contact Info */}
          <div>
            <h2 className="text-xl font-bold text-[#0f2557] mb-6">联系方式</h2>
            <div className="space-y-4 text-sm text-gray-700">
              {[
                ['📍', '地址', '山东省烟台市XX区XX路123号'],
                ['📞', '电话', '0535-0000-0000'],
                ['📠', '传真', '0535-0000-0001'],
                ['📧', '邮箱', 'info@optec-exp.com'],
                ['🕐', '营业时间', '周一至周五 09:00–18:00'],
              ].map(([icon, label, value]) => (
                <div key={label} className="flex gap-3">
                  <span className="text-base mt-0.5">{icon}</span>
                  <div>
                    <div className="text-gray-400 text-xs mb-0.5">{label}</div>
                    <div>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div>
            <h2 className="text-xl font-bold text-[#0f2557] mb-6">发送咨询</h2>
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center text-green-700">
                <div className="text-2xl mb-2">✅</div>
                <p className="font-semibold">已收到您的咨询</p>
                <p className="text-sm mt-1">我们将在1个工作日内回复您</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2557]"
                    placeholder="○○有限公司"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名 <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2557]"
                    placeholder="张　三"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2557]"
                    placeholder="example@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">咨询内容 <span className="text-red-400">*</span></label>
                  <textarea
                    required
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2557] resize-none"
                    placeholder="请描述您的货运需求（路线、货物类型、数量等）"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#0f2557] text-white font-semibold py-3 rounded-lg hover:bg-[#1a3a7a] transition"
                >
                  提交咨询
                </button>
              </form>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
