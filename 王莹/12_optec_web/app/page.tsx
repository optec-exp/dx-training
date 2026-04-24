import Link from 'next/link';

const services = [
  { icon: '✈️', title: '国际航空货运', desc: '日本↔中国主要航线，快速可靠的空运服务' },
  { icon: '🛃', title: '进出口通关', desc: '专业报关团队，全程代办清关手续' },
  { icon: '📦', title: '仓储与包装', desc: '温控仓库管理，专业包装解决方案' },
  { icon: '🔗', title: 'CellChain 冷链', desc: '医药品・生物样本专用温控物流' },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#0f2557] text-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-300 text-sm font-semibold tracking-widest uppercase mb-3">
            OPTEC EXPRESS CO., LTD.
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            专业国际航空货运代理<br />连接中日，畅达全球
          </h1>
          <p className="text-blue-200 text-lg mb-10 max-w-2xl mx-auto">
            山东上星国际货运代理有限公司，深耕国际物流行业，提供安全、高效、可追溯的一站式货运解决方案。
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/contact"
              className="bg-white text-[#0f2557] font-semibold px-8 py-3 rounded-full hover:bg-blue-50 transition"
            >
              立即咨询
            </Link>
            <Link
              href="/services"
              className="border border-white text-white px-8 py-3 rounded-full hover:bg-white/10 transition"
            >
              了解服务
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#0f2557] mb-12">核心服务</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s) => (
              <div key={s.title} className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-md transition">
                <div className="text-4xl mb-3">{s.icon}</div>
                <h3 className="font-semibold text-[#0f2557] mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-blue-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#0f2557] mb-4">需要货运解决方案？</h2>
          <p className="text-gray-600 mb-8">我们的专业团队随时为您提供报价和咨询服务</p>
          <Link
            href="/contact"
            className="bg-[#0f2557] text-white font-semibold px-10 py-3 rounded-full hover:bg-[#1a3a7a] transition"
          >
            联系我们
          </Link>
        </div>
      </section>
    </div>
  );
}
