import Link from 'next/link';

const services = [
  { icon: '✈️', title: 'NFO 紧急空运', desc: '利用最近可用航班，最快9小时送达，守护您的交货期限' },
  { icon: '🧳', title: 'Hand Carry（OBC）', desc: '专人随身携带货物，提供最高速度的紧急派送服务' },
  { icon: '🛃', title: '进出口通关代理', desc: '东京海关许可证持有，中日两国专业报关，全程无忧' },
  { icon: '🔬', title: 'CellChain 冷链物流', desc: '医药品・生物样本专用温控物流，GxP合规全程记录' },
];

const stats = [
  { value: '2,428件', label: '年度紧急空运' },
  { value: '570万kg', label: '年度运输重量' },
  { value: '186城市', label: '目的地覆盖' },
  { value: '30分钟', label: '报价响应' },
];

export default function HomePage() {
  return (
    <div className="bg-[#f8f9fc]">

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a1628] to-[#0f2557] text-white py-28 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 border border-[#c9a84c]/40 px-4 py-1.5 rounded-full mb-8">
            <div className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full"></div>
            <span className="text-[#c9a84c] text-xs font-semibold tracking-widest">JAPAN'S ONLY EMERGENCY CARGO SPECIALIST</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6 max-w-2xl">
            以时间为价值<br />守护您的每一次交货
          </h1>
          <p className="text-blue-200 text-lg mb-10 max-w-xl leading-relaxed">
            24小时全年无休 · 30分钟内报价 · 中日英三语对应<br />
            从东京到全球，让紧急不再是问题。
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/contact" className="bg-[#c9a84c] text-[#0a1628] font-bold px-8 py-3 hover:bg-[#b8963e] transition">
              立即获取报价
            </Link>
            <Link href="/services" className="border border-white/30 text-white px-8 py-3 hover:bg-white/10 transition">
              了解服务 →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-8">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg -mt-8 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          {stats.map((s) => (
            <div key={s.label} className="px-8 py-6 text-center">
              <div className="text-2xl font-bold text-[#0a1628] mb-1">{s.value}</div>
              <div className="text-gray-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-2">Our Services</p>
            <h2 className="text-2xl font-bold text-[#0a1628]">一站式货运解决方案</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition group">
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-[#0a1628] mb-2 text-sm">{s.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
                <div className="mt-4 text-[#c9a84c] text-xs font-semibold group-hover:translate-x-1 transition-transform">
                  了解详情 →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-8 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          {[
            { icon: '🌐', title: '国际会员网络', desc: '加入 TALA、WCA、MI Pharma、X2、ALNA、NAP 等国际组织，合作伙伴覆盖全球96个国家' },
            { icon: '🗣️', title: '三语对应', desc: '日语・中文・英语全天候服务，沟通零障碍' },
            { icon: '✅', title: 'IATA 认证', desc: 'IATA认证货运代理、危险品专业资质，合规有保障' },
          ].map((f) => (
            <div key={f.title}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-[#0a1628] mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Member bar */}
      <section className="bg-white border-t border-gray-100 py-12 px-8">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-6">加盟国际组织</p>
          <div className="flex gap-10 flex-wrap justify-center">
            {['TALA','WCA','MI Pharma','X2','ALNA','NAP'].map(n => (
              <span key={n} className="text-gray-400 text-sm font-semibold hover:text-[#0a1628] transition cursor-pointer">{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-8 bg-[#f8f9fc] text-center">
        <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-3">Contact Us</p>
        <h2 className="text-2xl font-bold text-[#0a1628] mb-4">30分钟内回复报价</h2>
        <p className="text-gray-500 mb-8">无论多紧急的货运需求，我们都能为您找到解决方案</p>
        <Link href="/contact" className="bg-[#0a1628] text-white font-bold px-10 py-3 hover:bg-[#0f2557] transition">
          联系我们
        </Link>
      </section>
    </div>
  );
}
