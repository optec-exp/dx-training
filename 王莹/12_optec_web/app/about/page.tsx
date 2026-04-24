const stats = [
  { value: '10+', label: '年行业经验' },
  { value: '96', label: 'TALA 网络覆盖国家' },
  { value: '24H', label: '紧急响应服务' },
  { value: 'ISO', label: '品质管理认证' },
];

const members = [
  { role: '代表取缔役', name: '○○　○○' },
  { role: '营业部', name: '○○　○○' },
  { role: '通关部', name: '○○　○○' },
  { role: '财务部', name: '王　莹' },
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-[#0f2557] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-3">公司概要</h1>
          <p className="text-blue-200">连接中日，诚信经营，专业服务</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-[#0f2557] mb-1">{s.value}</div>
              <div className="text-gray-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Company Info */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-[#0f2557] mb-6">会社情报</h2>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {[
                ['会社名', '山东上星国际货运代理有限公司'],
                ['英文名', 'OPTEC EXPRESS CO., LTD.'],
                ['设立年', '2014年'],
                ['所在地', '山东省烟台市XX区XX路123号'],
                ['电话', '0535-0000-0000'],
                ['邮箱', 'info@optec-exp.com'],
                ['税号', '91370000XXXXXXXXXX'],
                ['营业执照', 'XXXXXXXXXXXXXXXX'],
              ].map(([label, value]) => (
                <tr key={label} className="border-b border-gray-200">
                  <td className="py-3 pr-6 text-gray-500 w-32 font-medium">{label}</td>
                  <td className="py-3 text-gray-800">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Team */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-[#0f2557] mb-6">主要成员</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {members.map((m) => (
              <div key={m.role} className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="w-12 h-12 bg-[#0f2557] rounded-full mx-auto mb-2 flex items-center justify-center text-white text-lg font-bold">
                  {m.name[0]}
                </div>
                <div className="font-semibold text-sm text-gray-800">{m.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
