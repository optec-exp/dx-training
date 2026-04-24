const services = [
  {
    icon: '✈️',
    title: '国际航空货运',
    desc: '以东京（NRT/HND）和上海（PVG）为主要枢纽，提供稳定的中日空运定期航班服务。支持普货、危险品（DGR）及特殊货物。',
    features: ['出发地提货', '目的地派送', '实时追踪', '危险品资质'],
  },
  {
    icon: '🛃',
    title: '进出口通关代理',
    desc: '拥有丰富的中日两国通关经验，提供进出口报关、商品归类、许可证申请等全流程代办服务，确保货物顺利清关。',
    features: ['中国进出口报关', '日本进出口申报', '商品HS编码归类', '许可证代办'],
  },
  {
    icon: '📦',
    title: '仓储与包装',
    desc: '设有温控及常温仓库，提供货物暂存、分拣、重新包装及出货前检查服务，保障货物安全。',
    features: ['温控仓库', '常温仓库', '货物分拣', '出货检查'],
  },
  {
    icon: '🔬',
    title: 'CellChain 冷链物流',
    desc: '专为医药品、生物样本、临床试验物资设计的专业温控物流方案，全程温度记录与合规管理。',
    features: ['2–8°C / -20°C / -80°C', '温度全程记录', 'GxP合规', '紧急响应24H'],
  },
  {
    icon: '📋',
    title: '货运文件处理',
    desc: '提供AWB出具、提单审核、原产地证、商业发票等全套货运文件制作及管理服务。',
    features: ['AWB出具', '原产地证', '商业发票', '装箱单'],
  },
  {
    icon: '🌐',
    title: '全球代理网络（TALA）',
    desc: '通过TALA Network在全球96个国家拥有可信赖的合作伙伴，实现货物无缝中转与门到门服务。',
    features: ['96国覆盖', '本地专业代理', '门到门服务', '多式联运'],
  },
];

export default function ServicesPage() {
  return (
    <div>
      <section className="bg-[#0f2557] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-3">服务介绍</h1>
          <p className="text-blue-200">为您提供从起运地到目的地的全程一站式货运解决方案</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((s) => (
            <div key={s.title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="text-3xl mb-4">{s.icon}</div>
              <h2 className="text-lg font-bold text-[#0f2557] mb-2">{s.title}</h2>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">{s.desc}</p>
              <div className="flex flex-wrap gap-2">
                {s.features.map((f) => (
                  <span key={f} className="bg-blue-50 text-[#0f2557] text-xs px-3 py-1 rounded-full">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
