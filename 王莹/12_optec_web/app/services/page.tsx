const services = [
  {
    icon: '✈️',
    title: 'NFO（Next Flight Out）紧急空运',
    desc: '利用最近可用的航班，最大限度缩短运输时间。从接单到起飞，全程紧急对应，是守护交货期限的核心服务。',
    features: ['最快9小时送达', '24小时受理', '30分钟内报价', '全球主要航线'],
  },
  {
    icon: '🧳',
    title: 'Hand Carry（OBC）专人随身携带',
    desc: '由专业随行人员亲自携带货物乘坐航班，适用于极高时效要求或无法托运的特殊货物，最快实现9–20小时送达。',
    features: ['专人护送', '不经过货站', '全程实时追踪', '贵重品/样本适用'],
  },
  {
    icon: '📦',
    title: '一般国际航空货运',
    desc: '标准国际航空运输服务，覆盖中日、中美、中欧等主要贸易路线，提供稳定、合规、可追踪的货运方案。',
    features: ['普货・危险品(DGR)', '多航线选择', '实时追踪', 'IATA认证'],
  },
  {
    icon: '🔬',
    title: 'CellChain 冷链物流',
    desc: '专为医药品、生物样本、临床试验物资设计的专业温控物流方案，全程温度记录，严格遵守GxP法规要求。',
    features: ['2–8°C / -20°C / -80°C', '全程温度记录', 'GxP合规', '紧急响应24H'],
  },
  {
    icon: '🛃',
    title: '进出口通关代理',
    desc: '持有东京海关许可证（第737号），在中日两国拥有丰富通关经验，提供报关、商品归类、许可证申请等全流程代办。',
    features: ['东京海关许可#737', '中国进出口报关', 'HS编码归类', 'ATA Carnet申请'],
  },
  {
    icon: '📋',
    title: '专项代理服务',
    desc: '提供ACP（海关手续管理者）登记协助、产地证申请、JASTPRO代码申请、GHS标签制作等多项专业代理服务。',
    features: ['ACP登记协助', '原产地证', 'JASTPRO代码', 'GHS标签'],
  },
  {
    icon: '🏭',
    title: '特殊货物运输',
    desc: '拥有特殊航空货物运营商（RA）资质，承接展览物流、飞机零部件、医疗设备、防务货物等特殊品类运输。',
    features: ['展览物流', '飞机零部件', '医疗设备', '防务货物'],
  },
  {
    icon: '🌐',
    title: '全球合作网络',
    desc: 'OPTEC 加入了 TALA、WCA、MI Pharma、X2、ALNA、NAP 等国际货运代理会员组织，借助全球合作伙伴网络覆盖96个国家、186个目的地城市，提供门到门服务。',
    features: ['TALA / WCA / X2', 'MI Pharma / ALNA / NAP', '96国覆盖', '186目的地城市'],
  },
];

export default function ServicesPage() {
  return (
    <div className="bg-[#f8f9fc]">
      <section className="bg-gradient-to-br from-[#0a1628] to-[#0f2557] text-white py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-3">Our Services</p>
          <h1 className="text-3xl font-bold mb-3">服务介绍</h1>
          <p className="text-blue-200">从紧急空运到冷链物流，覆盖800+品类，提供全方位一站式货运解决方案</p>
        </div>
      </section>

      <section className="py-16 px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((s) => (
            <div key={s.title} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition group">
              <div className="text-3xl mb-4">{s.icon}</div>
              <h2 className="text-base font-bold text-[#0a1628] mb-2">{s.title}</h2>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">{s.desc}</p>
              <div className="flex flex-wrap gap-2">
                {s.features.map((f) => (
                  <span key={f} className="bg-[#0a1628]/5 text-[#0a1628] text-xs px-3 py-1 rounded-full">
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
