const stats = [
  { value: '2016', label: '创立年份' },
  { value: '54名', label: '中日合计员工数' },
  { value: '24H', label: '全年无休服务' },
];

const offices = [
  { flag: '🇯🇵', name: '日本总部', detail: '东京新桥 / 成田 / 大阪' },
  { flag: '🇨🇳', name: '中国', detail: '山东烟台（中国区总部）' },
  { flag: '🇻🇳', name: '越南', detail: 'Vietnam Office' },
  { flag: '🇺🇸', name: '美国', detail: 'USA Office' },
  { flag: '🇬🇧', name: '英国', detail: 'UK Office' },
  { flag: '🇲🇽', name: '墨西哥', detail: 'Mexico Office' },
];

const credentials = [
  'IATA 认证货运代理',
  '东京海关许可证（第737号）',
  '第二种货运业许可（航空・海运）',
  '特殊航空货物运营商（RA）资质',
  'IATA 危险品处理认证',
  'NVOCC 运营商',
];

export default function AboutPage() {
  return (
    <div className="bg-[#f8f9fc]">

      <section className="bg-gradient-to-br from-[#0a1628] to-[#0f2557] text-white py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-3">About Us</p>
          <h1 className="text-3xl font-bold mb-3">公司概要</h1>
          <p className="text-blue-200">以"展现时间的价值"为使命，守护每一个交货期限</p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-8">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg -mt-8 grid grid-cols-3 divide-x divide-gray-100">
          {stats.map((s) => (
            <div key={s.label} className="px-8 py-6 text-center">
              <div className="text-2xl font-bold text-[#0a1628] mb-1">{s.value}</div>
              <div className="text-gray-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-12 px-8">
        <div className="max-w-3xl mx-auto text-center bg-white rounded-2xl p-10 shadow-sm">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-3">Mission</p>
          <h2 className="text-xl font-bold text-[#0a1628] mb-4">经营理念</h2>
          <p className="text-gray-600 leading-relaxed">
            OPTEC EXPRESS 是<strong className="text-[#0a1628]">日本唯一的紧急货物物流专业公司</strong>。<br />
            我们以"展现时间的价值"为使命，24小时全年无休提供中日英三语服务。<br />
            无论多紧急的货运需求，我们都是守护您交货期限的最后后盾。
          </p>
        </div>
      </section>

      {/* Company Info */}
      <section className="py-8 px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-4">Company Info</p>
          <h2 className="text-xl font-bold text-[#0a1628] mb-6">会社情报</h2>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {[
                ['日本法人名', 'OPTEC EXPRESS CO., LTD.'],
                ['中国法人名', '山东上星国际货运代理有限公司'],
                ['日本总部', '东京都港区新桥2-10-5 新桥原大楼3F'],
                ['中国总部', '山东省烟台市XX区XX路123号'],
                ['设立', '2016年12月8日'],
                ['日本员工数', '16名'],
                ['中国员工数', '38名'],
                ['电话（中国）', '0535-0000-0000'],
                ['邮箱', 'info@optec-exp.com'],
                ['税号', '91370000XXXXXXXXXX'],
              ].map(([label, value]) => (
                <tr key={label} className="border-b border-gray-100">
                  <td className="py-3 pr-6 text-gray-400 w-36 text-xs font-medium">{label}</td>
                  <td className="py-3 text-gray-800 text-sm">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Global Offices */}
      <section className="py-8 px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-4">Global Network</p>
          <h2 className="text-xl font-bold text-[#0a1628] mb-6">全球拠点</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {offices.map((o) => (
              <div key={o.name} className="bg-[#f8f9fc] rounded-xl p-4 border border-gray-100">
                <div className="text-2xl mb-1">{o.flag}</div>
                <div className="font-semibold text-sm text-[#0a1628]">{o.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{o.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-8 px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-4">Credentials</p>
          <h2 className="text-xl font-bold text-[#0a1628] mb-6">资质・许可</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {credentials.map((c) => (
              <div key={c} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-[#c9a84c] font-bold">✓</span>
                {c}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Member Networks */}
      <section className="py-8 px-8 pb-16">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-2">Memberships</p>
          <h2 className="text-xl font-bold text-[#0a1628] mb-2">加盟国际组织</h2>
          <p className="text-gray-400 text-xs mb-6">通过多个国际货运代理会员组织，与全球合作伙伴建立信赖关系</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'TALA', desc: 'The Airline Logistics Association' },
              { name: 'WCA', desc: 'World Cargo Alliance' },
              { name: 'MI Pharma', desc: '医药品物流专业网络' },
              { name: 'X2', desc: '紧急货运专业网络' },
              { name: 'ALNA', desc: 'Air Logistics Network Association' },
              { name: 'NAP', desc: 'Network of Airfreight Professionals' },
            ].map((org) => (
              <div key={org.name} className="bg-[#f8f9fc] rounded-xl p-4 border border-gray-100 text-center">
                <div className="font-bold text-[#0a1628] text-base mb-1">{org.name}</div>
                <div className="text-xs text-gray-400">{org.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
