export default function Footer() {
  return (
    <footer className="bg-[#0a1628] text-blue-300">
      <div className="max-w-6xl mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Logo & company */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 bg-[#c9a84c] rounded-sm"></div>
            <span className="text-white font-bold tracking-wider text-sm">OPTEC EXPRESS</span>
          </div>
          <p className="text-blue-300 text-xs mb-1">山东上星国际货运代理有限公司</p>
          <p className="text-blue-400 text-xs mt-2 leading-relaxed">
            日本唯一的紧急货物物流专业公司<br />
            以"展现时间的价值"为使命
          </p>
        </div>

        {/* Contact */}
        <div>
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-4">联系方式</p>
          <div className="space-y-1.5 text-xs text-blue-400">
            <p>📍 山东省烟台市XX区XX路123号</p>
            <p>📞 0535-0000-0000</p>
            <p>📧 info@optec-exp.com</p>
            <p className="text-[#c9a84c] font-semibold mt-2">24/7 全年无休服务</p>
          </div>
        </div>

        {/* Links */}
        <div>
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-4">页面导航</p>
          <div className="space-y-1.5 text-xs text-blue-400">
            {['首页','服务介绍','公司概要','联系我们'].map(l => (
              <p key={l} className="hover:text-white transition cursor-pointer">{l}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-8 py-4">
        <p className="text-center text-blue-500 text-xs">
          © {new Date().getFullYear()} OPTEC EXPRESS CO., LTD. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
