export type Lang = 'ja' | 'zh' | 'en'

const translations = {
  ja: {
    lang_label: { ja: 'JP', zh: '中', en: 'EN' },
    nav: {
      about: 'イベント概要', segments: '展示区', schedule: 'プログラム',
      faq: 'FAQ', register: '出展登録',
    },
    hero: {
      eyebrow: 'Transport Logistic China 2026',
      h1: ['Air Cargo', 'China 2026'],
      desc: 'アジア最大級の航空貨物専門国際展示会。世界中の航空会社・空港・フォワーダー・物流テクノロジー企業が上海に集結します。',
      btn_register: '出展・来場登録',
      btn_program: 'プログラムを見る',
    },
    stats: [
      { value: '130+', label: '出展社数' },
      { value: '60%+', label: '国際出展比率' },
      { value: '6',    label: '専門セッション' },
      { value: '3',    label: '開催日数' },
    ],
    about: {
      badge: 'About the Event',
      h2: 'アジアの航空貨物産業を\nつなぐ3日間',
      desc: 'Air Cargo China は、Transport Logistic China（TLC）と同時開催される航空貨物専門国際展示会です。慕尼黑博覧集団（Messe München）が主催し、世界の航空会社・空港オペレーター・フォワーダー・ロジスティクステクノロジー企業が一堂に集まります。2026年は「World Air Cargo Awards」授賞式も上海で同時開催されます。',
    },
    segments: [
      { title: '航空会社・カーゴキャリア', desc: '国際・国内の旅客航空会社および貨物専門航空会社。最新の輸送能力・ルートを展示' },
      { title: '空港・地上支援',           desc: '空港オペレーター、グランドハンドリング機器・サービス、ULDソリューション' },
      { title: 'フォワーダー・物流',       desc: '国際フォワーダー、3PL・4PLプロバイダー、カスタムクリアランス、サプライチェーン' },
      { title: '医薬品・コールドチェーン', desc: 'GDP準拠温度管理輸送、医薬品ロジスティクス、コールドストレージ、生鮮品輸送' },
      { title: 'テクノロジー・デジタル',   desc: 'カーゴIT・TMS・WMS、追跡・可視化システム、AI・自動化・ドローンソリューション' },
      { title: 'サステナビリティ',         desc: '持続可能な航空燃料（SAF）、カーボンオフセット、グリーンロジスティクス戦略' },
    ],
    why: [
      { icon: '🤝', title: 'グローバルネットワーキング', desc: '世界60カ国以上から集まる航空貨物業界のリーダーと直接交流できる貴重な機会' },
      { icon: '🏆', title: 'World Air Cargo Awards', desc: '業界最高峰の栄誉。授賞式が本展示会と同時開催。受賞企業・個人と同じ場に立てる' },
      { icon: '🔍', title: '最新ソリューション発見', desc: '最先端の航空カーゴテクノロジー・サービスを一堂に体験。ビジネスの次の一手を探す' },
    ],
    schedule: {
      badge: 'Program',
      h2: 'イベントプログラム',
      days: [
        {
          title: '展示会初日',
          sessions: [
            '10:00  オープニングセレモニー',
            '11:00  展示会オープン',
            '18:00  ウェルカムレセプション',
          ],
        },
        {
          title: 'コンファレンス & アワード',
          sessions: [
            '09:30  Air Cargo 専門コンファレンス（全6セッション）',
            '14:00  テクノロジー・イノベーションフォーラム',
            '19:00  World Air Cargo Awards 授賞式',
          ],
        },
        {
          title: '最終日・クロージング',
          sessions: [
            '09:30  コンファレンス続き',
            '14:00  B2B ネットワーキングセッション',
            '15:00  展示会クロージング',
          ],
        },
      ],
    },
    faq: [
      { q: 'Air Cargo China 2026 の開催日時・場所は？', a: '2026年6月24日（水）〜26日（金）、上海新国際博覧中心（SNIEC）にて開催されます。Transport Logistic China と同時開催です。' },
      { q: 'どのような企業・方が参加できますか？', a: '航空会社・空港オペレーター・国際フォワーダー・物流テクノロジー企業・医薬品物流専門企業など、航空貨物業界に関わるすべての方が対象です。' },
      { q: '来場登録の方法は？費用は？', a: '公式ウェブサイトより事前のオンライン来場登録が必要です。来場登録は無料です。当日登録も可能ですが、事前登録の方がスムーズです。' },
      { q: '出展申込の方法は？', a: '慕尼黑博覧集団（Messe München）の担当部署にお問合せください。スタンドのサイズ・位置・料金をご相談いただけます。早期申込で好立地の確保が可能です。' },
      { q: 'コンファレンスへの参加には別途料金が必要ですか？', a: 'メインコンファレンスへのフルアクセスにはプレミアムパスが必要です。一部セッションは展示会入場証でもご参加いただけます。' },
      { q: '日本語対応・通訳サービスはありますか？', a: 'メインセッションは中国語・英語で対応。日本語通訳については別途お問合せください。弊社（OPTEC Express）では日本語での参加サポートも行っています。' },
    ],
    register: {
      badge: 'Register Now',
      h2: '出展・来場登録',
      desc: '2026年6月24〜26日、上海で開催の Air Cargo China にご参加ください。来場は無料事前登録制です。出展をご希望の方はお早めにお申込みください。',
      btn_visitor: '来場者登録（無料）',
      btn_exhibitor: '出展のお問合せ',
    },
    support: {
      btn_label: 'お問合せ',
      title: 'カスタマーサポート',
      hours_label: '受付時間',
      hours: '月〜金  09:00 — 17:00',
      tz: '日本時間（JST / UTC+9）',
      note: '上記時間外はメールにてお問合せください',
      email_label: 'メール',
      email: 'info@aircargochina.jp',
      close: '閉じる',
    },
    footer: '© 2026 Air Cargo China — Transport Logistic China  |  Organised by Messe München Shanghai Co., Ltd.',
  },

  zh: {
    lang_label: { ja: 'JP', zh: '中', en: 'EN' },
    nav: {
      about: '活动概述', segments: '展区介绍', schedule: '活动日程',
      faq: '常见问题', register: '参展报名',
    },
    hero: {
      eyebrow: 'Transport Logistic China 2026',
      h1: ['Air Cargo', 'China 2026'],
      desc: '亚洲规模最大的航空货运专业国际展览会。全球航空公司、机场、货运代理及物流科技企业汇聚上海。',
      btn_register: '参展 / 参观报名',
      btn_program: '查看活动日程',
    },
    stats: [
      { value: '130+', label: '参展商数' },
      { value: '60%+', label: '国际参展比例' },
      { value: '6',    label: '专项论坛场次' },
      { value: '3',    label: '展览天数' },
    ],
    about: {
      badge: 'About the Event',
      h2: '连接亚洲航空货运产业\n的三天盛会',
      desc: 'Air Cargo China 是与 Transport Logistic China（TLC）同期举办的航空货运专业国际展览会，由慕尼黑博览集团（Messe München）主办。全球航空公司、机场运营商、货运代理及物流科技企业齐聚一堂。2026年将同期举办「世界航空货运大奖（World Air Cargo Awards）」颁奖典礼。',
    },
    segments: [
      { title: '航空公司与货运航空',     desc: '国际及国内客运航空公司、全货运航空公司，展示最新运输能力与航线网络' },
      { title: '机场与地面保障',         desc: '机场运营商、地面服务设备与服务商、集装设备（ULD）解决方案' },
      { title: '货运代理与物流',         desc: '国际货运代理、3PL/4PL服务商、报关服务、供应链管理解决方案' },
      { title: '医药品与冷链物流',       desc: 'GDP标准温控运输、医药品物流、冷库管理、生鲜品运输解决方案' },
      { title: '科技与数字化',           desc: '货运IT系统、TMS/WMS、货物追踪可视化、AI与自动化及无人机解决方案' },
      { title: '可持续发展',             desc: '可持续航空燃料（SAF）、碳中和物流、绿色供应链战略与实践' },
    ],
    why: [
      { icon: '🤝', title: '全球网络拓展', desc: '与来自全球60多个国家的航空货运行业领袖面对面交流，建立高价值业务关系' },
      { icon: '🏆', title: 'World Air Cargo Awards', desc: '行业最高荣誉颁奖典礼同期举办。与获奖企业同台，彰显企业影响力' },
      { icon: '🔍', title: '发现前沿解决方案', desc: '集中体验最新航空货运科技与服务，为企业下一步发展寻找灵感与合作机会' },
    ],
    schedule: {
      badge: 'Program',
      h2: '活动日程',
      days: [
        {
          title: '展览首日',
          sessions: [
            '10:00  开幕典礼',
            '11:00  展览正式开放',
            '18:00  欢迎晚宴',
          ],
        },
        {
          title: '论坛 & 颁奖典礼',
          sessions: [
            '09:30  Air Cargo 专项论坛（共6场）',
            '14:00  科技创新论坛',
            '19:00  世界航空货运大奖颁奖典礼',
          ],
        },
        {
          title: '最终日 · 闭幕',
          sessions: [
            '09:30  论坛（续）',
            '14:00  B2B 商务对接会',
            '15:00  展览闭幕',
          ],
        },
      ],
    },
    faq: [
      { q: 'Air Cargo China 2026 的举办时间和地点？', a: '2026年6月24日（周三）至26日（周五），在上海新国际博览中心（SNIEC）举办，与 Transport Logistic China 同期举行。' },
      { q: '哪些企业和人员适合参加？', a: '航空公司、机场运营商、国际货运代理、物流科技企业、医药品物流公司等所有航空货运相关行业人士均可参加。' },
      { q: '参观如何报名？是否免费？', a: '需通过官方网站提前在线报名，参观免费。现场也可注册，但提前报名可节省时间。' },
      { q: '如何申请展位？', a: '请联系慕尼黑博览集团（Messe München）相关负责人，咨询展位尺寸、位置及费用。建议尽早预订，以确保理想位置。' },
      { q: '论坛需要额外购票吗？', a: '主论坛全程参与需持高级通行证。部分场次凭参观证即可入场，具体请参阅官方网站。' },
      { q: '是否提供中文服务？', a: '主论坛提供中英文双语服务。如需日语支持，欢迎联系我们（OPTEC Express）提供参展协助。' },
    ],
    register: {
      badge: 'Register Now',
      h2: '参展 / 参观报名',
      desc: '诚邀您参加2026年6月24至26日在上海举办的 Air Cargo China。参观免费预注册，有意参展的企业请尽早提交申请。',
      btn_visitor: '参观报名（免费）',
      btn_exhibitor: '参展咨询',
    },
    support: {
      btn_label: '联系客服',
      title: '客户服务',
      hours_label: '服务时间',
      hours: '周一至周五  09:00 — 17:00',
      tz: '日本时间（JST / UTC+9）',
      note: '非工作时间请发送邮件联系',
      email_label: '邮件',
      email: 'info@aircargochina.jp',
      close: '关闭',
    },
    footer: '© 2026 Air Cargo China — Transport Logistic China  |  主办：慕尼黑博览（上海）有限公司',
  },

  en: {
    lang_label: { ja: 'JP', zh: '中', en: 'EN' },
    nav: {
      about: 'About', segments: 'Segments', schedule: 'Schedule',
      faq: 'FAQ', register: 'Register',
    },
    hero: {
      eyebrow: 'Transport Logistic China 2026',
      h1: ['Air Cargo', 'China 2026'],
      desc: "Asia's premier international exhibition for the air cargo industry. Airlines, airports, forwarders, and logistics technology companies converge in Shanghai.",
      btn_register: 'Register to Exhibit / Visit',
      btn_program: 'View Program',
    },
    stats: [
      { value: '130+', label: 'Exhibitors' },
      { value: '60%+', label: 'International' },
      { value: '6',    label: 'Conference Sessions' },
      { value: '3',    label: 'Days' },
    ],
    about: {
      badge: 'About the Event',
      h2: '3 Days Connecting\nAsia\'s Air Cargo Industry',
      desc: 'Air Cargo China is the dedicated air freight exhibition co-located with Transport Logistic China (TLC), organised by Messe München Shanghai Co., Ltd. Airlines, airport operators, freight forwarders, and logistics technology firms gather in Shanghai to do business and shape the future of air cargo. The 2026 edition will also host the prestigious World Air Cargo Awards ceremony.',
    },
    segments: [
      { title: 'Airlines & Cargo Carriers',  desc: 'International and domestic passenger airlines and pure freighter operators showcasing routes, capacity, and services' },
      { title: 'Airports & Ground Handling', desc: 'Airport operators, ground handling equipment, ULD solutions, and ramp services' },
      { title: 'Freight Forwarding & Logistics', desc: 'International forwarders, 3PL/4PL providers, customs clearance, and supply chain solutions' },
      { title: 'Pharma & Cold Chain',        desc: 'GDP-compliant temperature-controlled transport, pharmaceutical logistics, cold storage, and perishables' },
      { title: 'Technology & Digital',       desc: 'Cargo IT, TMS/WMS, shipment tracking, AI, automation, and drone solutions for air freight' },
      { title: 'Sustainability',             desc: 'Sustainable Aviation Fuel (SAF), carbon-neutral logistics, and green supply chain strategies' },
    ],
    why: [
      { icon: '🤝', title: 'Global Networking', desc: 'Meet face-to-face with air cargo industry leaders from 60+ countries in one dedicated marketplace' },
      { icon: '🏆', title: 'World Air Cargo Awards', desc: "The industry's most prestigious awards ceremony, co-located with the exhibition. Celebrate excellence with the best in the business" },
      { icon: '🔍', title: 'Discover New Solutions', desc: 'Experience cutting-edge air cargo technology and services first-hand — find your next business breakthrough' },
    ],
    schedule: {
      badge: 'Program',
      h2: 'Event Program',
      days: [
        {
          title: 'Day 1 — Opening',
          sessions: [
            '10:00  Opening Ceremony',
            '11:00  Exhibition Opens',
            '18:00  Welcome Reception',
          ],
        },
        {
          title: 'Day 2 — Conference & Awards',
          sessions: [
            '09:30  Air Cargo Conference (6 sessions)',
            '14:00  Technology & Innovation Forum',
            '19:00  World Air Cargo Awards Ceremony',
          ],
        },
        {
          title: 'Day 3 — Closing Day',
          sessions: [
            '09:30  Conference (continued)',
            '14:00  B2B Matchmaking Sessions',
            '15:00  Exhibition Closes',
          ],
        },
      ],
    },
    faq: [
      { q: 'When and where is Air Cargo China 2026?', a: 'June 24–26, 2026 at the Shanghai New International Expo Centre (SNIEC), co-located with Transport Logistic China.' },
      { q: 'Who should attend?', a: 'Airlines, airport operators, freight forwarders, logistics technology companies, pharmaceutical logistics specialists, and all professionals involved in the air cargo industry.' },
      { q: 'How do I register as a visitor? Is it free?', a: 'Visitor registration is free. Please pre-register online via the official website. Walk-in registration is also available at the venue.' },
      { q: 'How do I book an exhibition stand?', a: 'Contact Messe München Shanghai to discuss stand sizes, locations, and pricing. Early booking is recommended to secure preferred positions.' },
      { q: 'Does conference access require a separate ticket?', a: 'Full conference access requires a premium pass. Some sessions are accessible with a standard visitor badge — check the official website for details.' },
      { q: 'Is Japanese language support available?', a: 'Main sessions are conducted in Chinese and English. For Japanese language assistance, please contact OPTEC Express — we provide support for Japanese participants.' },
    ],
    register: {
      badge: 'Register Now',
      h2: 'Register to Exhibit or Visit',
      desc: 'Join Air Cargo China 2026 in Shanghai, June 24–26. Visitor registration is free. Exhibitor applications are open — book your stand early.',
      btn_visitor: 'Register as Visitor (Free)',
      btn_exhibitor: 'Enquire About Exhibiting',
    },
    support: {
      btn_label: 'Contact Us',
      title: 'Customer Support',
      hours_label: 'Office Hours',
      hours: 'Mon – Fri  09:00 — 17:00',
      tz: 'Japan Standard Time (JST / UTC+9)',
      note: 'Outside office hours, please send us an email',
      email_label: 'Email',
      email: 'info@aircargochina.jp',
      close: 'Close',
    },
    footer: '© 2026 Air Cargo China — Transport Logistic China  |  Organised by Messe München Shanghai Co., Ltd.',
  },
} satisfies Record<Lang, unknown>

export default translations
export type T = typeof translations.en
