export default function Footer() {
  return (
    <footer className="bg-[#0a1a3e] text-gray-400 text-sm">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between gap-4">
        <div>
          <p className="text-white font-semibold mb-1">山东上星国际货运代理有限公司</p>
          <p>OPTEC EXPRESS CO., LTD.</p>
          <p className="mt-1">地址：山东省烟台市XX区XX路123号</p>
          <p>电话：0535-0000-0000　邮箱：info@optec-exp.com</p>
        </div>
        <div className="text-right">
          <p className="mb-1">营业时间：周一至周五 09:00–18:00</p>
          <p>© {new Date().getFullYear()} OPTEC EXPRESS CO., LTD.</p>
        </div>
      </div>
    </footer>
  );
}
