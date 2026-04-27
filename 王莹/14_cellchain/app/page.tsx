'use client';
import { useState } from 'react';

// ── Tab 数据 ────────────────────────────────────────────
const tabs = [
  {
    id: 'pharma',
    label: '医药品・生物制品',
    icon: '💊',
    tagline: '严格温控，守护每一份药品的活性与安全',
    temp: '2–8°C / -20°C / -80°C',
    desc: '针对冷链药品、血液及血液制品、生物制品的专项运输方案。基于GDP规范，通过经验证的温控包装与固定航班安排，确保全程温度不超出规定范围。',
    items: [
      { icon: '💉', title: '冷链药品', desc: '2–8°C 或其他明确温控区间的药品，全程 Datalogger 记录' },
      { icon: '🩸', title: '血液及血液制品', desc: '严格符合医疗法规要求，专用包装与操作流程' },
      { icon: '🧬', title: '生物制品', desc: '蛋白质、抗体、疫苗等生物来源制品的合规运输' },
    ],
    compliance: ['GDP（药品良好分销规范）', 'IATA DGR 危险品规程', '全程温度记录（Datalogger）', '经验证的被动温控包装（Passive）'],
    color: 'from-[#0a4a7a] to-[#0d6ebd]',
    accent: '#0d6ebd',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'cell',
    label: '细胞治疗・临床样本',
    icon: '🔬',
    tagline: '从实验室到临床，每一个样本都不容有失',
    temp: '-80°C / 液氮（LN₂）',
    desc: '专为细胞治疗产品、临床研究样本及检测样本设计的极低温运输方案。时效性极强，配合紧急空运（NFO）与Hand Carry服务，保障样本完整性。',
    items: [
      { icon: '🧫', title: '细胞治疗产品', desc: 'CAR-T、干细胞等高价值细胞产品，超低温全程管控' },
      { icon: '🧪', title: '临床研究样本', desc: '临床试验用样本，严格链式监管，文件完整合规' },
      { icon: '🏥', title: '检测样本', desc: '医学检测用血液、组织等样本，时效优先专项处理' },
    ],
    compliance: ['IATA P650 感染性物质规程', '链式监管（Chain of Custody）', '超低温运输容器验证', 'GDP临床试验专项要求'],
    color: 'from-[#065f46] to-[#059669]',
    accent: '#059669',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'industrial',
    label: '温敏工业材料',
    icon: '⚙️',
    tagline: '精密材料的温度管理，影响最终产品的品质',
    temp: '客制化温控区间',
    desc: '针对半导体温敏材料等对温度敏感的工业用途货物，提供客制化温控运输方案。结合OPTEC的紧急空运能力，满足制造业对时效与品质的双重要求。',
    items: [
      { icon: '💻', title: '半导体温敏材料', desc: '光刻胶、特殊化学品等需严格温控的半导体原材料' },
      { icon: '🔧', title: '精密电子元件', desc: '对温湿度敏感的高精密电子零部件专项包装运输' },
      { icon: '🏭', title: '其他温敏工业品', desc: '依据货物特性提供定制化温控方案与合规文件支持' },
    ],
    compliance: ['客制化温控验证方案', 'IATA DGR（如适用）', '温湿度全程监控', '与制造商SOP对接'],
    color: 'from-[#4c1d95] to-[#7c3aed]',
    accent: '#7c3aed',
    badge: 'bg-violet-100 text-violet-700',
  },
];

export default function CellChainPage() {
  const [activeTab, setActiveTab] = useState(0);
  const tab = tabs[activeTab];

  return (
    <div className="bg-[#f0f7ff] min-h-screen">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0d6ebd] rounded-lg flex items-center justify-center text-white text-sm font-black">C</div>
            <div>
              <span className="text-[#0a1628] font-black text-base tracking-wide">CellChain</span>
              <span className="text-[#0d6ebd] font-black text-base"> Logistics</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">Powered by <span className="text-[#0a1628] font-semibold">OPTEC EXPRESS</span></div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a1e3d] to-[#0d3a7a] text-white py-20 px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full mb-6">
            <div className="w-1.5 h-1.5 bg-[#38bdf8] rounded-full animate-pulse"></div>
            <span className="text-[#38bdf8] text-xs font-semibold tracking-widest">LIFE SCIENCE COLD CHAIN LOGISTICS</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            CellChain <span className="text-[#38bdf8]">定期便</span>
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto leading-relaxed mb-4">
            专为生命科学货物中日间定期运输而建立的专项温控管理体系
          </p>
          <p className="text-blue-300 text-sm max-w-xl mx-auto">
            基于 GDP・IATA DGR 规范，通过经验证的温控包装与固定航班安排，对运输全过程实施统一管理与控制。
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-8">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg -mt-8 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          {[
            ['🌡️', '多温区支持', '2–8°C / -20°C / -80°C'],
            ['✈️', 'NFO 紧急対応', '最短9時間送達'],
            ['📋', 'GDP 準拠', '全行程合規記錄'],
            ['🔒', 'Chain of Custody', '鎖式監管保障'],
          ].map(([icon, label, value]) => (
            <div key={label} className="px-6 py-5 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-[#0a1628] text-xs font-bold mb-0.5">{label}</div>
              <div className="text-gray-400 text-xs">{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tab 区域 */}
      <section className="py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#0d6ebd] text-xs font-bold tracking-widest uppercase mb-2">Services</p>
            <h2 className="text-2xl font-bold text-[#0a1628]">三大服务领域</h2>
          </div>

          {/* Tab 按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            {tabs.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(i)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === i
                    ? 'bg-white shadow-md text-[#0a1628] border-2 border-[#0d6ebd]'
                    : 'bg-white/60 text-gray-500 hover:bg-white hover:shadow-sm border-2 border-transparent'
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab 内容 */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* 顶部色带 */}
            <div className={`bg-gradient-to-r ${tab.color} p-8 text-white`}>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">{tab.icon}</span>
                    <h3 className="text-xl font-bold">{tab.label}</h3>
                  </div>
                  <p className="text-white/80 text-sm max-w-xl leading-relaxed">{tab.tagline}</p>
                </div>
                <div className="bg-white/20 rounded-xl px-5 py-3 text-center">
                  <div className="text-white/70 text-xs mb-1">温控区间</div>
                  <div className="text-white font-bold text-sm">{tab.temp}</div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <p className="text-gray-600 text-sm leading-relaxed mb-8">{tab.desc}</p>

              {/* 三个子服务卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {tab.items.map((item) => (
                  <div key={item.title} className="bg-[#f8fafc] rounded-xl p-5 border border-gray-100">
                    <div className="text-2xl mb-3">{item.icon}</div>
                    <h4 className="font-bold text-[#0a1628] text-sm mb-2">{item.title}</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* 合规要求 */}
              <div className="border-t border-gray-100 pt-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">合规要求</p>
                <div className="flex flex-wrap gap-2">
                  {tab.compliance.map((c) => (
                    <span key={c} className={`text-xs px-3 py-1.5 rounded-full font-medium ${tab.badge}`}>
                      ✓ {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 流程说明 */}
      <section className="py-16 px-8 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[#0d6ebd] text-xs font-bold tracking-widest uppercase mb-2">Process</p>
          <h2 className="text-2xl font-bold text-[#0a1628] mb-10">标准作业流程</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {[
              ['📞', '接单确认', '30分钟内报价'],
              ['📦', '包装准备', '温控包装蓄冷/回冷'],
              ['✈️', '固定航班', 'NFO 紧急对应'],
              ['🌡️', '全程监控', 'Datalogger 记录'],
              ['🏥', '目的地交付', '链式监管完整'],
            ].map(([icon, title, sub], i) => (
              <div key={title} className="flex items-center gap-4">
                <div className="text-center">
                  <div className="w-14 h-14 bg-[#f0f7ff] rounded-full flex items-center justify-center text-2xl mx-auto mb-2 border-2 border-[#0d6ebd]/20">
                    {icon}
                  </div>
                  <div className="font-bold text-[#0a1628] text-xs">{title}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{sub}</div>
                </div>
                {i < 4 && <div className="text-gray-300 text-xl hidden md:block">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-8 bg-gradient-to-br from-[#0a1e3d] to-[#0d3a7a] text-white text-center">
        <p className="text-[#38bdf8] text-xs font-bold tracking-widest uppercase mb-3">Contact</p>
        <h2 className="text-2xl font-bold mb-4">为您的货物定制温控方案</h2>
        <p className="text-blue-200 text-sm mb-8">24小时全年无休，30分钟内回复报价</p>
        <a
          href="mailto:info@optec-exp.com"
          className="bg-[#38bdf8] text-[#0a1e3d] font-bold px-10 py-3 rounded-sm hover:bg-[#7dd3fc] transition inline-block"
        >
          立即咨询
        </a>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a1628] py-5 px-8 text-center">
        <p className="text-blue-500 text-xs">© 2026 CellChain Logistics — Powered by OPTEC EXPRESS CO., LTD.</p>
      </footer>
    </div>
  );
}
