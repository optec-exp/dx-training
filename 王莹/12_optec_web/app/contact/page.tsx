'use client';
import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="bg-[#f8f9fc]">
      <section className="bg-gradient-to-br from-[#0a1628] to-[#0f2557] text-white py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-3">Contact Us</p>
          <h1 className="text-3xl font-bold mb-3">联系我们</h1>
          <p className="text-blue-200">欢迎随时咨询货运相关问题，30分钟内回复报价</p>
        </div>
      </section>

      <section className="py-16 px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">

          {/* Contact Info */}
          <div>
            <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-4">Info</p>
            <h2 className="text-xl font-bold text-[#0a1628] mb-6">联系方式</h2>
            <div className="space-y-5">
              {[
                ['📍', '地址', '山东省烟台市XX区XX路123号'],
                ['📞', '电话', '0535-0000-0000'],
                ['📠', '传真', '0535-0000-0001'],
                ['📧', '邮箱', 'info@optec-exp.com'],
                ['🕐', '营业时间', '24/7 全年无休'],
              ].map(([icon, label, value]) => (
                <div key={label} className="flex gap-4 items-start">
                  <div className="w-9 h-9 bg-[#0a1628]/5 rounded-lg flex items-center justify-center text-base flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-0.5">{label}</div>
                    <div className="text-gray-800 text-sm font-medium">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div>
            <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-4">Inquiry</p>
            <h2 className="text-xl font-bold text-[#0a1628] mb-6">发送咨询</h2>
            {submitted ? (
              <div className="bg-white border border-[#c9a84c]/30 rounded-2xl p-8 text-center shadow-sm">
                <div className="text-3xl mb-3">✅</div>
                <p className="font-bold text-[#0a1628]">已收到您的咨询</p>
                <p className="text-gray-400 text-sm mt-2">我们将在30分钟内回复您</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl p-8 shadow-sm">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    公司名称 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0a1628]"
                    placeholder="○○有限公司"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    姓名 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0a1628]"
                    placeholder="张　三"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    邮箱 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0a1628]"
                    placeholder="example@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    咨询内容 <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0a1628] resize-none"
                    placeholder="请描述您的货运需求（路线、货物类型、数量等）"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#0a1628] text-white font-bold py-3 rounded-lg hover:bg-[#0f2557] transition"
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
