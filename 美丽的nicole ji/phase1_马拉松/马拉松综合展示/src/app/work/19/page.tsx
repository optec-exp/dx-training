'use client';
import { useState } from 'react';

interface Phrase {
  id: number;
  en: string;
  zh: string;
  ja: string;
  note: string;
}

interface Category {
  key: string;
  label: string;
  emoji: string;
  color: string;
  phrases: Phrase[];
}

const CATEGORIES: Category[] = [
  {
    key: 'email_open', label: '邮件开头', emoji: '✉️', color: '#3b82f6',
    phrases: [
      { id: 101, en: 'I hope this email finds you well.', zh: '希望您一切安好。', ja: 'お世話になっております。', note: '最常用的邮件开场白，礼貌通用' },
      { id: 102, en: 'Thank you for your prompt reply.', zh: '感谢您的迅速回复。', ja: 'お早いご返信ありがとうございます。', note: '对方快速回复时使用' },
      { id: 103, en: 'I am writing to follow up on our previous conversation.', zh: '本邮件是就我们上次的沟通进行跟进。', ja: '先日のご連絡の件でフォローアップのご連絡をしております。', note: '追踪之前话题时使用' },
      { id: 104, en: 'Please find the details below regarding your shipment.', zh: '请见下方关于您货物的详细信息。', ja: '下記に貨物の詳細をご確認ください。', note: '发送货物信息时的标准开头' },
      { id: 105, en: 'I am reaching out regarding your inquiry dated [date].', zh: '本邮件是回复您[日期]的询问。', ja: '[日付]付けでいただいたお問い合わせについてご連絡いたします。', note: '正式回复客户询问' },
    ],
  },
  {
    key: 'email_close', label: '邮件结尾', emoji: '🤝', color: '#8b5cf6',
    phrases: [
      { id: 201, en: 'Please do not hesitate to contact us if you have any questions.', zh: '如有任何疑问，请随时与我们联系。', ja: 'ご不明な点がございましたら、お気軽にお問い合わせください。', note: '最通用的结尾，几乎适用所有邮件' },
      { id: 202, en: 'We look forward to hearing from you.', zh: '期待您的回复。', ja: 'ご返信をお待ちしております。', note: '期待对方回复时使用' },
      { id: 203, en: 'Thank you for your continued support and cooperation.', zh: '感谢您一直以来的支持与合作。', ja: '引き続きよろしくお願いいたします。', note: '日常往来邮件结尾，表达维系关系之意' },
      { id: 204, en: 'We apologize for any inconvenience caused.', zh: '对由此带来的不便，我们深感歉意。', ja: 'ご不便をおかけし、大変申し訳ございません。', note: '出现问题、延误时的道歉结尾' },
      { id: 205, en: 'Best regards, / Sincerely yours,', zh: '此致，敬礼 / 顺颂商祺', ja: '何卒よろしくお願いいたします。/ 敬具', note: '邮件签名前的结束敬语' },
    ],
  },
  {
    key: 'quote', label: '询价与报价', emoji: '💰', color: '#f59e0b',
    phrases: [
      { id: 301, en: 'Could you please provide us with a quotation for the following shipment?', zh: '请您就以下货物提供报价。', ja: '以下の貨物につきまして、お見積もりをいただけますでしょうか。', note: '向同行或供应商询价的标准句式' },
      { id: 302, en: 'Our rates are as follows, all-in from origin to destination.', zh: '我方报价如下，包含始发地至目的地全程费用。', ja: '弊社の料金は以下の通りです。出発地から目的地までのオールイン価格です。', note: '发报价单时的说明语' },
      { id: 303, en: 'The above rates are valid until [date] and subject to space availability.', zh: '以上价格有效期至[日期]，以舱位可用为前提。', ja: '上記料金は[日付]まで有効で、スペースの確保を条件とします。', note: '报价单中必须注明有效期和舱位条件' },
      { id: 304, en: 'Kindly note that fuel surcharge and security surcharge are subject to change.', zh: '请注意，燃油附加费和安保附加费可能随时变动。', ja: '燃油サーチャージおよびセキュリティサーチャージは変動する場合があります。', note: '附加费免责声明，报价必备' },
      { id: 305, en: 'We would appreciate it if you could consider our competitive rates.', zh: '希望您能考虑我方具有竞争力的价格。', ja: '弊社の競争力ある料金をご検討いただければ幸いです。', note: '推销自家报价时的礼貌用语' },
    ],
  },
  {
    key: 'shipment', label: '货物状态通知', emoji: '✈️', color: '#10b981',
    phrases: [
      { id: 401, en: 'Your shipment has been picked up and is now in transit.', zh: '您的货物已取件，目前正在运输中。', ja: 'お荷物はピックアップ済みで、現在輸送中です。', note: '货物起运后第一时间通知客户' },
      { id: 402, en: 'We are pleased to inform you that your cargo has departed on flight [flight no.].', zh: '欣告您的货物已搭乘[航班号]航班起飞。', ja: '[便名]にてお荷物が出発したことをお知らせします。', note: '货物起飞后的正式通知' },
      { id: 403, en: 'Your shipment has arrived at the destination airport and is currently undergoing customs clearance.', zh: '您的货物已抵达目的地机场，目前正在办理清关手续。', ja: 'お荷物は目的地空港に到着し、現在通関手続き中です。', note: '货物到港清关阶段的通知' },
      { id: 404, en: 'We regret to inform you that your shipment has been delayed due to [reason].', zh: '非常遗憾地通知您，由于[原因]，您的货物出现延误。', ja: '[理由]により、お荷物に遅延が発生しましたことをお知らせします。', note: '延误通知，需同时说明原因和预计新时间' },
      { id: 405, en: 'Your shipment has been successfully delivered to the consignee.', zh: '您的货物已成功交付给收货人。', ja: 'お荷物は荷受人に無事お届けしました。', note: '货物完成派送后的结案通知' },
    ],
  },
  {
    key: 'complaint', label: '投诉处理', emoji: '🛠️', color: '#ef4444',
    phrases: [
      { id: 501, en: 'We sincerely apologize for the inconvenience this has caused.', zh: '对于给您带来的不便，我们诚挚地道歉。', ja: 'このたびはご迷惑をおかけしましたこと、心よりお詫び申し上げます。', note: '处理投诉的第一步：先道歉，再解释' },
      { id: 502, en: 'We are currently investigating the matter and will revert to you with an update shortly.', zh: '我们正在调查此事，将尽快向您反馈最新情况。', ja: 'ただいま調査中でございます。近日中に状況をご報告いたします。', note: '问题尚未查清时的稳定客户用语' },
      { id: 503, en: 'After thorough investigation, we have found that the delay was caused by [reason].', zh: '经过深入调查，我们发现延误系由[原因]造成。', ja: '詳細な調査の結果、[理由]により遅延が発生したことが判明しました。', note: '调查结束后的正式答复' },
      { id: 504, en: 'As a gesture of goodwill, we would like to offer you a discount on your next shipment.', zh: '作为诚意表示，我们愿意为您的下次货物提供折扣。', ja: '誠意のしるしとして、次回のご利用に際し割引を提供させていただきます。', note: '客户补救措施，维系关系' },
      { id: 505, en: 'Please rest assured that we have taken steps to prevent this from happening again.', zh: '请放心，我们已采取措施防止此类情况再次发生。', ja: '再発防止に向けた措置を講じましたのでご安心ください。', note: '投诉处理结尾，给客户信心' },
    ],
  },
  {
    key: 'phone', label: '电话用语', emoji: '📞', color: '#06b6d4',
    phrases: [
      { id: 601, en: 'Good morning, this is [name] from OPTEC Express. How may I help you?', zh: '早上好，我是OPTEC Express的[姓名]，请问有什么可以帮到您？', ja: 'おはようございます。OPTEC Expressの[名前]と申します。どのようなご用件でしょうか。', note: '接听电话的标准开场白' },
      { id: 602, en: 'Could you please hold for a moment? I will transfer you to the right person.', zh: '请稍等，我为您转接到相关负责人。', ja: '少々お待ちください。担当者におつなぎいたします。', note: '需要转接或查询时的过渡用语' },
      { id: 603, en: 'I am sorry, he / she is not available at the moment. May I take a message?', zh: '非常抱歉，他/她目前不在。请问需要我转达留言吗？', ja: '申し訳ございません、ただいま席を外しております。ご伝言をお預かりしましょうか。', note: '对方不在时的礼貌处理' },
      { id: 604, en: 'Could you please repeat that? I want to make sure I have the correct information.', zh: '能否请您再重复一遍？我想确认信息是否正确。', ja: '恐れ入りますが、もう一度おっしゃっていただけますでしょうか。確認させてください。', note: '听不清或需要确认时，不要怕问' },
      { id: 605, en: 'Thank you for calling. I will get back to you with the information by [time].', zh: '感谢您的来电，我会在[时间]前将相关信息回复给您。', ja: 'お電話いただきありがとうございます。[時間]までに情報をご連絡いたします。', note: '结束电话时给出明确的跟进承诺' },
    ],
  },
  {
    key: 'customs', label: '清关沟通', emoji: '🔍', color: '#f97316',
    phrases: [
      { id: 701, en: 'Please provide us with the commercial invoice and packing list for customs clearance.', zh: '请提供商业发票和装箱单以便办理清关手续。', ja: '通関のため、商業インボイスとパッキングリストをご提供ください。', note: '向客户索取清关文件的标准用语' },
      { id: 702, en: 'Your shipment has been selected for customs inspection. This may cause a delay of approximately [X] days.', zh: '您的货物被海关选中查验，可能导致约[X]天的延误。', ja: 'お荷物が税関検査の対象となりました。約[X]日の遅延が生じる見込みです。', note: '货物被查验时务必第一时间通知客户' },
      { id: 703, en: 'Could you please confirm the HS code for the goods? This is required for customs declaration.', zh: '请确认货物的HS编码，这是海关申报的必要信息。', ja: '通関申告に必要なため、品目のHSコードをご確認いただけますでしょうか。', note: 'HS编码直接影响税率，需核实' },
      { id: 704, en: 'The import duty for this shipment has been calculated as follows. Please arrange payment at your earliest convenience.', zh: '本批货物的进口关税计算如下，请尽快安排缴纳。', ja: '今回の貨物の輸入関税は以下の通りです。お早めにお支払いのご手配をお願いいたします。', note: '通知客户税款金额并催付' },
      { id: 705, en: 'Your goods have been cleared by customs and will be delivered to your premises by [date].', zh: '您的货物已完成清关，预计于[日期]送达您处。', ja: '貨物の通関が完了しました。[日付]までにお届けの予定です。', note: '清关放行后的最终通知' },
    ],
  },
];

type LangKey = 'en' | 'zh' | 'ja';

const LANG_LABEL: Record<LangKey, string> = { en: '🇬🇧 English', zh: '🇨🇳 中文', ja: '🇯🇵 日本語' };
const LANG_COLOR: Record<LangKey, string> = { en: '#3b82f6', zh: '#ef4444', ja: '#f97316' };

function PhraseCard({ phrase, primaryLang }: { phrase: Phrase; primaryLang: LangKey }) {
  const [revealed, setRevealed] = useState<Set<LangKey>>(new Set([primaryLang]));
  const [copied, setCopied] = useState<LangKey | null>(null);

  const toggle = (lang: LangKey) => {
    setRevealed(p => {
      const next = new Set(p);
      if (next.has(lang)) { next.delete(lang); } else { next.add(lang); }
      return next;
    });
  };

  const copy = async (lang: LangKey) => {
    await navigator.clipboard.writeText(phrase[lang]);
    setCopied(lang);
    setTimeout(() => setCopied(null), 1500);
  };

  const LANGS: LangKey[] = ['en', 'zh', 'ja'];

  return (
    <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 18, border: '1px solid #1e3a5f' }}>
      {/* Language rows */}
      {LANGS.map(lang => {
        const show = revealed.has(lang);
        const isPrimary = lang === primaryLang;
        const color = LANG_COLOR[lang];
        return (
          <div key={lang} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: show ? 6 : 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 100 }}>{LANG_LABEL[lang]}</span>
              {!isPrimary && (
                <button onClick={() => toggle(lang)} style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 5,
                  border: `1px solid ${show ? color : '#1e3a5f'}`,
                  background: show ? color + '22' : 'transparent',
                  color: show ? color : '#64748b', cursor: 'pointer',
                }}>
                  {show ? '隐藏' : '显示'}
                </button>
              )}
              {show && (
                <button onClick={() => copy(lang)} style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 5, marginLeft: 'auto',
                  border: '1px solid #1e3a5f', background: 'transparent',
                  color: copied === lang ? '#4ade80' : '#64748b', cursor: 'pointer',
                }}>
                  {copied === lang ? '✅' : '复制'}
                </button>
              )}
            </div>
            {show && (
              <div style={{
                fontSize: lang === 'ja' ? 13 : 14,
                color: isPrimary ? '#e2e8f0' : '#94a3b8',
                lineHeight: 1.6, paddingLeft: 4,
                fontStyle: isPrimary ? 'normal' : 'italic',
              }}>
                {phrase[lang]}
              </div>
            )}
          </div>
        );
      })}

      {/* Note */}
      <div style={{
        marginTop: 8, paddingTop: 8, borderTop: '1px solid #1e2537',
        fontSize: 11, color: '#475569', lineHeight: 1.5,
      }}>
        💡 {phrase.note}
      </div>
    </div>
  );
}

export default function Page() {
  const [activeCat, setActiveCat]     = useState(CATEGORIES[0].key);
  const [primaryLang, setPrimaryLang] = useState<LangKey>('en');
  const [search, setSearch]           = useState('');

  const cat = CATEGORIES.find(c => c.key === activeCat)!;

  const filtered = search.trim()
    ? CATEGORIES.flatMap(c => c.phrases).filter(p =>
        p.en.toLowerCase().includes(search.toLowerCase()) ||
        p.zh.includes(search) ||
        p.ja.includes(search),
      )
    : cat.phrases;

  const totalPhrases = CATEGORIES.reduce((s, c) => s + c.phrases.length, 0);

  return (
    <div style={{ minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🌐 业务三语短句</div>
          <div style={{ color: '#64748b', fontSize: 14 }}>英语 · 中文 · 日语 · 共 {totalPhrases} 句 · {CATEGORIES.length} 大场景</div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {/* Search */}
          <input
            style={{
              flex: 1, minWidth: 180,
              background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: 8,
              color: '#e2e8f0', padding: '9px 14px', fontSize: 13,
            }}
            placeholder="搜索短句（英/中/日均可）…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {/* Primary language */}
          <div style={{ display: 'flex', background: '#0d1b2e', borderRadius: 8, border: '1px solid #1e3a5f', padding: 3, gap: 3 }}>
            {(['en', 'zh', 'ja'] as LangKey[]).map(lang => (
              <button key={lang} onClick={() => setPrimaryLang(lang)} style={{
                padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
                background: primaryLang === lang ? LANG_COLOR[lang] + '33' : 'transparent',
                color: primaryLang === lang ? LANG_COLOR[lang] : '#64748b',
                fontWeight: primaryLang === lang ? 700 : 400,
              }}>
                {LANG_LABEL[lang].split(' ')[0]} {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Category tabs */}
        {!search && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setActiveCat(c.key)} style={{
                padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
                border: `1px solid ${activeCat === c.key ? c.color : '#1e3a5f'}`,
                background: activeCat === c.key ? c.color + '22' : 'transparent',
                color: activeCat === c.key ? c.color : '#64748b',
                fontWeight: activeCat === c.key ? 600 : 400, transition: 'all .15s',
              }}>
                {c.emoji} {c.label}
                <span style={{ marginLeft: 5, fontSize: 11, opacity: .7 }}>{c.phrases.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Hint */}
        {!search && (
          <div style={{
            background: '#0d1b2e', borderRadius: 10, padding: '10px 16px',
            border: `1px solid ${cat.color}44`, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>{cat.emoji}</span>
            <div>
              <span style={{ fontWeight: 600, color: cat.color }}>{cat.label}</span>
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 10 }}>
                主语言：{LANG_LABEL[primaryLang]} · 点击"显示"展开其他两种语言 · 支持一键复制
              </span>
            </div>
          </div>
        )}

        {/* Phrase cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>没有找到相关短句</div>
          )}
          {filtered.map(phrase => (
            <PhraseCard key={phrase.id} phrase={phrase} primaryLang={primaryLang} />
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#475569' }}>
          主语言常显 · 点击"显示"对照其他语言 · 点击"复制"直接使用
        </div>
      </div>
    </div>
  );
}
