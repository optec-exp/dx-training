'use client';
import { useState } from 'react';

// ── 多语言内容 ──────────────────────────────────────────
const content = {
  zh: {
    langLabel: '中文',
    nav: { booth: '展会信息', services: '展示服务', contact: '预约会面' },
    hero: {
      event: 'Air Cargo China 2026',
      tagline: 'OPTEC EXPRESS 参展公告',
      desc: '我们将携全线紧急货运服务亮相 Air Cargo China 2026，诚邀您莅临参观交流。',
      cta: '预约会面',
    },
    eventInfo: {
      title: '展会信息',
      items: [
        { icon: '📅', label: '日期', value: '2026年6月24日 – 26日' },
        { icon: '📍', label: '地点', value: '上海新国际博览中心' },
        { icon: '🏢', label: '展馆规模', value: '15,000 m² 航空货运专区' },
        { icon: '👥', label: '预计参观人数', value: '40,000名专业观众' },
        { icon: '🏷️', label: 'OPTEC 展位', value: '详情请联系我们确认' },
      ],
    },
    services: {
      title: '展示服务',
      subtitle: '欢迎来到我们的展位，了解全线服务',
      items: [
        { icon: '✈️', title: 'NFO 紧急空运', desc: '最近航班起飞，最快9小时送达，守护您的交货期限' },
        { icon: '🧳', title: 'Hand Carry（OBC）', desc: '专人随身携带货物，适用极高时效要求的紧急运输' },
        { icon: '🔬', title: 'CellChain 冷链物流', desc: '医药品・生物样本专用温控方案，GxP合规全程记录' },
        { icon: '🛃', title: '进出口通关代理', desc: '中日两国专业报关，东京海关许可证持有' },
        { icon: '🌐', title: '全球合作网络', desc: '加盟TALA、WCA等6大国际组织，覆盖全球合作伙伴' },
        { icon: '📋', title: '专项代理服务', desc: 'ACP登记、原产地证、GHS标签等多项专业代办' },
      ],
    },
    forum: {
      title: '同期活动',
      items: [
        { icon: '🎤', title: '2026 航空货运论坛', desc: '行业专家共同探讨当前挑战与未来趋势' },
        { icon: '🏆', title: 'World Air Cargo Awards', desc: '国际航空货运大奖颁奖典礼及晚宴' },
        { icon: '🤝', title: '多展联动', desc: '一票通行四大同期展会，850+全球企业汇聚' },
      ],
    },
    contact: {
      title: '预约会面',
      desc: '希望在展会期间与我们深入交流？请提前联系，我们将安排专属洽谈时间。',
      items: [
        { icon: '📧', label: '邮箱', value: 'info@optec-exp.com' },
        { icon: '📞', label: '电话', value: '0535-0000-0000' },
        { icon: '🕐', label: '服务时间', value: '24/7 全年无休' },
      ],
      cta: '发送邮件预约',
    },
    footer: '© 2026 OPTEC EXPRESS CO., LTD. — Air Cargo China 2026',
  },

  en: {
    langLabel: 'English',
    nav: { booth: 'Event Info', services: 'Services', contact: 'Contact' },
    hero: {
      event: 'Air Cargo China 2026',
      tagline: 'OPTEC EXPRESS Exhibition Announcement',
      desc: 'We are proud to exhibit at Air Cargo China 2026, showcasing our full range of emergency cargo logistics services. We look forward to meeting you.',
      cta: 'Schedule a Meeting',
    },
    eventInfo: {
      title: 'Event Information',
      items: [
        { icon: '📅', label: 'Dates', value: 'June 24–26, 2026' },
        { icon: '📍', label: 'Venue', value: 'Shanghai New International Expo Centre' },
        { icon: '🏢', label: 'Scale', value: '15,000 m² Air Cargo Dedicated Area' },
        { icon: '👥', label: 'Expected Visitors', value: '40,000 Trade Professionals' },
        { icon: '🏷️', label: 'OPTEC Booth', value: 'Contact us for booth details' },
      ],
    },
    services: {
      title: 'Our Services',
      subtitle: 'Visit our booth to discover our full service portfolio',
      items: [
        { icon: '✈️', title: 'NFO Emergency Airfreight', desc: 'Next flight out, delivery in as fast as 9 hours' },
        { icon: '🧳', title: 'Hand Carry (OBC)', desc: 'Personal courier service for the most time-critical shipments' },
        { icon: '🔬', title: 'CellChain Cold Chain', desc: 'GxP-compliant temperature-controlled logistics for pharma & bio samples' },
        { icon: '🛃', title: 'Customs Brokerage', desc: 'Licensed customs broker in Japan & China, full clearance services' },
        { icon: '🌐', title: 'Global Network', desc: 'Member of TALA, WCA & 4 more international organizations' },
        { icon: '📋', title: 'Agency Services', desc: 'ACP registration, certificate of origin, GHS labeling & more' },
      ],
    },
    forum: {
      title: 'Co-located Events',
      items: [
        { icon: '🎤', title: '2026 Air Cargo Forum', desc: 'Industry leaders discuss current challenges and future trends' },
        { icon: '🏆', title: 'World Air Cargo Awards', desc: 'International awards ceremony and gala dinner' },
        { icon: '🤝', title: 'Multi-show Platform', desc: 'One badge for four simultaneous shows, 850+ global companies' },
      ],
    },
    contact: {
      title: 'Schedule a Meeting',
      desc: 'Want to connect with us at the show? Contact us in advance to arrange a dedicated meeting.',
      items: [
        { icon: '📧', label: 'Email', value: 'info@optec-exp.com' },
        { icon: '📞', label: 'Phone', value: '+86-535-0000-0000' },
        { icon: '🕐', label: 'Availability', value: '24/7 Year-round' },
      ],
      cta: 'Send Meeting Request',
    },
    footer: '© 2026 OPTEC EXPRESS CO., LTD. — Air Cargo China 2026',
  },

  ja: {
    langLabel: '日本語',
    nav: { booth: '展示会情報', services: '展示サービス', contact: 'お問い合わせ' },
    hero: {
      event: 'Air Cargo China 2026',
      tagline: 'OPTEC EXPRESS 出展のご案内',
      desc: 'Air Cargo China 2026 に出展いたします。全サービスラインナップをご紹介しますので、ぜひブースにお立ち寄りください。',
      cta: '商談を予約する',
    },
    eventInfo: {
      title: '展示会情報',
      items: [
        { icon: '📅', label: '開催日程', value: '2026年6月24日（水）〜26日（金）' },
        { icon: '📍', label: '会場', value: '上海新国際博覧センター' },
        { icon: '🏢', label: '展示規模', value: '航空貨物専用エリア 15,000 m²' },
        { icon: '👥', label: '来場者数（予定）', value: '専門来場者 40,000名' },
        { icon: '🏷️', label: 'OPTEC ブース番号', value: '詳細はお問い合わせください' },
      ],
    },
    services: {
      title: '展示サービス',
      subtitle: 'ブースにてすべてのサービスをご紹介します',
      items: [
        { icon: '✈️', title: 'NFO 緊急航空輸送', desc: '最短9時間で届ける、最速クラスの緊急輸送サービス' },
        { icon: '🧳', title: 'ハンドキャリー（OBC）', desc: '専任スタッフが直接携行、あらゆる緊急貨物に対応' },
        { icon: '🔬', title: 'CellChain コールドチェーン', desc: '医薬品・生体サンプル専用、GxP準拠の温度管理輸送' },
        { icon: '🛃', title: '輸出入通関代理', desc: '日中両国の通関を一括代行、東京税関許可取得済み' },
        { icon: '🌐', title: 'グローバルネットワーク', desc: 'TALA・WCAなど6つの国際組織に加盟' },
        { icon: '📋', title: '専門代理サービス', desc: 'ACP登録、原産地証明、GHSラベル作成など多数対応' },
      ],
    },
    forum: {
      title: '併催イベント',
      items: [
        { icon: '🎤', title: '2026 航空貨物フォーラム', desc: '業界専門家による課題と将来トレンドの議論' },
        { icon: '🏆', title: 'World Air Cargo Awards', desc: '国際航空貨物アワード授賞式・ガラディナー' },
        { icon: '🤝', title: 'マルチショー連携', desc: '1枚のバッジで4展示会に入場可能、850社以上が集結' },
      ],
    },
    contact: {
      title: '商談予約',
      desc: '展示会期間中に詳しくお話ししませんか？事前にご連絡いただければ、専用の商談時間をご用意します。',
      items: [
        { icon: '📧', label: 'メール', value: 'info@optec-exp.com' },
        { icon: '📞', label: '電話', value: '+86-535-0000-0000' },
        { icon: '🕐', label: '対応時間', value: '24時間365日対応' },
      ],
      cta: 'メールで予約する',
    },
    footer: '© 2026 OPTEC EXPRESS CO., LTD. — Air Cargo China 2026',
  },
};

type Lang = 'zh' | 'en' | 'ja';

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('zh');
  const t = content[lang];

  return (
    <div className="bg-[#f8f9fc] min-h-screen">

      {/* Header */}
      <header className="bg-[#0a1628] sticky top-0 z-50 shadow-lg">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#c9a84c] rounded-sm"></div>
            <span className="text-white text-sm font-bold tracking-widest">OPTEC EXPRESS</span>
          </div>
          <nav className="hidden md:flex gap-8 text-xs text-blue-200">
            <a href="#booth" className="hover:text-white transition">{t.nav.booth}</a>
            <a href="#services" className="hover:text-white transition">{t.nav.services}</a>
            <a href="#contact" className="hover:text-white transition">{t.nav.contact}</a>
          </nav>
          {/* 语言切换 */}
          <div className="flex gap-1">
            {(['zh', 'en', 'ja'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`text-xs px-3 py-1.5 rounded font-semibold transition ${
                  lang === l
                    ? 'bg-[#c9a84c] text-[#0a1628]'
                    : 'text-blue-300 hover:text-white'
                }`}
              >
                {content[l].langLabel}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a1628] to-[#0f2557] text-white py-24 px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-[#c9a84c]/40 px-4 py-1.5 rounded-full mb-6">
            <div className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full"></div>
            <span className="text-[#c9a84c] text-xs font-semibold tracking-widest">Shanghai · June 24–26, 2026</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.hero.event}</h1>
          <p className="text-[#c9a84c] font-semibold mb-6 text-lg">{t.hero.tagline}</p>
          <p className="text-blue-200 max-w-2xl mx-auto leading-relaxed mb-10">{t.hero.desc}</p>
          <a
            href="#contact"
            className="bg-[#c9a84c] text-[#0a1628] font-bold px-10 py-3 hover:bg-[#b8963e] transition inline-block"
          >
            {t.hero.cta}
          </a>
        </div>
      </section>

      {/* Event Info */}
      <section id="booth" className="px-8">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg -mt-8 p-8">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-6">{t.eventInfo.title}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {t.eventInfo.items.map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-gray-400 text-xs mb-1">{item.label}</div>
                <div className="text-[#0a1628] text-sm font-semibold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-2">{t.services.title}</p>
            <h2 className="text-2xl font-bold text-[#0a1628]">{t.services.subtitle}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.services.items.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition group">
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-[#0a1628] mb-2 text-sm">{s.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
                <div className="mt-4 text-[#c9a84c] text-xs font-semibold group-hover:translate-x-1 transition-transform">→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Forum */}
      <section className="py-16 px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-10 text-center">{t.forum.title}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {t.forum.items.map((f) => (
              <div key={f.title}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-[#0a1628] mb-2 text-sm">{f.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-10 text-center">
          <p className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase mb-4">{t.contact.title}</p>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">{t.contact.desc}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-10 mb-10">
            {t.contact.items.map((item) => (
              <div key={item.label}>
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="text-gray-400 text-xs">{item.label}</div>
                <div className="text-[#0a1628] text-sm font-semibold">{item.value}</div>
              </div>
            ))}
          </div>
          <a
            href="mailto:info@optec-exp.com"
            className="bg-[#0a1628] text-white font-bold px-10 py-3 hover:bg-[#0f2557] transition inline-block"
          >
            {t.contact.cta}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a1628] py-6 px-8 text-center">
        <p className="text-blue-400 text-xs">{t.footer}</p>
      </footer>

    </div>
  );
}
