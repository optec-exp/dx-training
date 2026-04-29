'use client';
import { useState } from 'react';

type Lang = 'zh' | 'ja' | 'en';
type EmailType = 'quote' | 'arrival' | 'delay' | 'inquiry' | 'thanks';

interface Fields {
  customerName: string;
  handler: string;
  cargo: string;
  weight: string;
  amount: string;
  validity: string;
  awb: string;
  arrivalDate: string;
  pickupLocation: string;
  originalDate: string;
  newDate: string;
  delayReason: string;
  inquiryContent: string;
  cooperation: string;
}

const INITIAL: Fields = {
  customerName: '', handler: '王莹', cargo: '', weight: '', amount: '', validity: '',
  awb: '', arrivalDate: '', pickupLocation: '浦东机场货站',
  originalDate: '', newDate: '', delayReason: '', inquiryContent: '', cooperation: '',
};

const EMAIL_TYPES: { id: EmailType; label: Record<Lang, string> }[] = [
  { id: 'quote', label: { zh: '📋 报价单发送', ja: '📋 見積書送付', en: '📋 Quote Submission' } },
  { id: 'arrival', label: { zh: '✈️ 到港通知', ja: '✈️ 到着案内', en: '✈️ Arrival Notice' } },
  { id: 'delay', label: { zh: '⏰ 延误通知', ja: '⏰ 遅延通知', en: '⏰ Delay Notice' } },
  { id: 'inquiry', label: { zh: '💬 咨询回复', ja: '💬 お問い合わせ回答', en: '💬 Inquiry Reply' } },
  { id: 'thanks', label: { zh: '🤝 感谢函', ja: '🤝 お礼状', en: '🤝 Thank You Letter' } },
];

function generateEmail(type: EmailType, lang: Lang, f: Fields): string {
  const greet: Record<Lang, string> = {
    zh: `尊敬的${f.customerName || '[客户名]'}先生/女士，\n\n您好！我是OPTEC的${f.handler || '[负责人]'}。`,
    ja: `${f.customerName || '[お客様名]'} 様\n\nいつもお世話になっております。OPTEC ${f.handler || '[担当者]'}でございます。`,
    en: `Dear ${f.customerName || '[Customer Name]'},\n\nI hope this email finds you well. This is ${f.handler || '[Handler]'} from OPTEC.`,
  };
  const sign: Record<Lang, string> = {
    zh: `\n\n如有任何疑问，请随时联系我。\n\n此致\n敬礼\n\n${f.handler || '[负责人]'}\nOPTEC株式会社 DX室\nTel: +86-21-XXXX-XXXX\nEmail: ${f.handler ? f.handler.toLowerCase() : 'xxx'}@optec-exp.com`,
    ja: `\n\nご不明な点がございましたら、何卒お気軽にご連絡ください。\n\n何卒よろしくお願いいたします。\n\n${f.handler || '[担当者]'}\nOPTEC株式会社 DX室\nTel: +86-21-XXXX-XXXX`,
    en: `\n\nPlease feel free to contact me if you have any questions.\n\nBest regards,\n${f.handler || '[Handler]'}\nOPTEC Co., Ltd. DX Dept.\nTel: +86-21-XXXX-XXXX`,
  };
  const body: Record<EmailType, Record<Lang, string>> = {
    quote: {
      zh: `\n\n兹随函附上您所需货物的运费报价，具体如下：\n\n　货物名称：${f.cargo || '[货物名称]'}\n　重量：${f.weight || '[重量]'} kg\n　报价金额：CNY ${f.amount || '[金额]'}\n　报价有效期：${f.validity || '[有效期]'}\n\n本报价包含基本运费及相关附加费用，如需详细费用分解，请告知。`,
      ja: `\n\nご依頼いただきました貨物の運賃見積書をお送りいたします。\n\n　貨物品名：${f.cargo || '[品名]'}\n　重量：${f.weight || '[重量]'} kg\n　お見積金額：CNY ${f.amount || '[金額]'}\n　有効期限：${f.validity || '[有効期限]'}\n\n本見積には基本運賃及び諸付帯費用を含みます。詳細な費用内訳が必要な場合はお知らせください。`,
      en: `\n\nPlease find enclosed the freight quotation for your cargo as follows:\n\n　Cargo Description: ${f.cargo || '[Cargo]'}\n　Weight: ${f.weight || '[Weight]'} kg\n　Quoted Amount: CNY ${f.amount || '[Amount]'}\n　Validity: ${f.validity || '[Validity]'}\n\nThis quote includes basic freight and related surcharges. Please let us know if you need a detailed cost breakdown.`,
    },
    arrival: {
      zh: `\n\n谨通知您，您的货物已安全抵达目的地。\n\n　提单号（AWB）：${f.awb || '[AWB号]'}\n　到港日期：${f.arrivalDate || '[日期]'}\n　提货地点：${f.pickupLocation || '[地点]'}\n\n请携带相关单据前往提货。如需我方协助清关，请及时与我联系。`,
      ja: `\n\nお客様の貨物が目的地に到着いたしましたことをご連絡申し上げます。\n\n　AWB番号：${f.awb || '[AWB番号]'}\n　到着日：${f.arrivalDate || '[日付]'}\n　引取場所：${f.pickupLocation || '[場所]'}\n\n関係書類をご持参の上、お引取りをお願いいたします。通関のサポートが必要な場合はお知らせください。`,
      en: `\n\nWe are pleased to inform you that your cargo has arrived safely at the destination.\n\n　AWB No.: ${f.awb || '[AWB No.]'}\n　Arrival Date: ${f.arrivalDate || '[Date]'}\n　Pickup Location: ${f.pickupLocation || '[Location]'}\n\nPlease bring the relevant documents for pickup. Contact us if you need customs clearance assistance.`,
    },
    delay: {
      zh: `\n\n非常抱歉地通知您，您的货物运输出现延误情况，具体如下：\n\n　提单号（AWB）：${f.awb || '[AWB号]'}\n　原定到达日期：${f.originalDate || '[原定日期]'}\n　预计新到达日期：${f.newDate || '[新日期]'}\n　延误原因：${f.delayReason || '[原因]'}\n\n对此给您带来的不便，我们深表歉意。我们将密切跟踪货物状态，并及时向您更新最新情况。`,
      ja: `\n\nお客様の貨物の輸送に遅延が発生しましたことを、誠に申し訳ございませんがご報告申し上げます。\n\n　AWB番号：${f.awb || '[AWB番号]'}\n　当初到着予定日：${f.originalDate || '[当初予定]'}\n　新しい到着予定日：${f.newDate || '[新予定]'}\n　遅延理由：${f.delayReason || '[理由]'}\n\nご不便をおかけし、誠に申し訳ございません。引き続き貨物の状況を注視し、最新情報を随時ご連絡いたします。`,
      en: `\n\nWe regret to inform you that there is a delay in the transportation of your cargo.\n\n　AWB No.: ${f.awb || '[AWB No.]'}\n　Original Arrival Date: ${f.originalDate || '[Original Date]'}\n　New Expected Arrival Date: ${f.newDate || '[New Date]'}\n　Reason for Delay: ${f.delayReason || '[Reason]'}\n\nWe sincerely apologize for any inconvenience caused. We will closely monitor the cargo status and keep you updated.`,
    },
    inquiry: {
      zh: `\n\n感谢您的咨询。针对您提出的问题，我们回复如下：\n\n${f.inquiryContent || '[请填写咨询内容及回复]'}\n\n如您还有其他疑问，欢迎随时联系我们。`,
      ja: `\n\nお問い合わせいただきありがとうございます。ご質問についての回答をお送りいたします。\n\n${f.inquiryContent || '[お問い合わせ内容と回答をご記入ください]'}\n\nその他ご不明な点がございましたら、お気軽にお問い合わせください。`,
      en: `\n\nThank you for your inquiry. Please find our response below:\n\n${f.inquiryContent || '[Please fill in the inquiry content and response]'}\n\nIf you have any further questions, please do not hesitate to contact us.`,
    },
    thanks: {
      zh: `\n\n衷心感谢贵公司长期以来对OPTEC的信任与支持。\n\n在过去的合作中，${f.cooperation || '[合作内容]'}，我们深感荣幸能与贵司携手共进。\n\n未来，我们将继续秉持专业、高效的服务理念，为贵司提供更优质的物流解决方案。期待与贵司保持长久的合作关系。`,
      ja: `\n\nOPTECに対する長年のご支援とご信頼に、心より感謝申し上げます。\n\nこれまでの${f.cooperation || '[協力内容]'}において、貴社と共に歩めたことを大変光栄に存じます。\n\n今後も専門的かつ効率的なサービスを提供し、より優れた物流ソリューションをご提供できるよう努めてまいります。引き続きのご愛顧を賜りますようお願い申し上げます。`,
      en: `\n\nWe would like to express our sincere gratitude for your continued trust and support of OPTEC.\n\nThroughout our collaboration on ${f.cooperation || '[cooperation details]'}, we have been truly honored to work alongside your esteemed company.\n\nWe remain committed to providing professional and efficient logistics solutions, and look forward to our continued partnership.`,
    },
  };
  const subjects: Record<EmailType, Record<Lang, string>> = {
    quote: { zh: '【运费报价】', ja: '【運賃見積のご案内】', en: '[Freight Quotation]' },
    arrival: { zh: '【到港通知】', ja: '【貨物到着のご案内】', en: '[Arrival Notice]' },
    delay: { zh: '【运输延误通知】', ja: '【輸送遅延のお知らせ】', en: '[Delay Notice]' },
    inquiry: { zh: '【回复您的咨询】', ja: '【お問い合わせへの回答】', en: '[Reply to Your Inquiry]' },
    thanks: { zh: '【感谢函】', ja: '【御礼】', en: '[Letter of Appreciation]' },
  };
  return `件名/Subject: ${subjects[type][lang]} ${f.cargo || f.awb || f.cooperation || ''}\n\n${greet[lang]}${body[type][lang]}${sign[lang]}`;
}

export default function Page() {
  const [lang, setLang] = useState<Lang>('zh');
  const [type, setType] = useState<EmailType>('quote');
  const [fields, setFields] = useState<Fields>(INITIAL);
  const [copied, setCopied] = useState(false);

  const emailText = generateEmail(type, lang, fields);

  function set(key: keyof Fields, val: string) {
    setFields(prev => ({ ...prev, [key]: val }));
  }

  async function copy() {
    await navigator.clipboard.writeText(emailText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const langLabels: Record<Lang, string> = { zh: '中文', ja: '日本語', en: 'English' };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-800 text-white py-4 px-6 shadow">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">✉️ 三语邮件模板生成器</h1>
            <p className="text-blue-200 text-sm mt-0.5">OPTEC DX室 · 中 / 日 / 英</p>
          </div>
          <div className="flex gap-2">
            {(['zh','ja','en'] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${lang === l ? 'bg-white text-blue-800' : 'text-blue-200 hover:text-white hover:bg-blue-700'}`}>
                {langLabels[l]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Config */}
        <div className="space-y-4">
          {/* Email type */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-700 mb-3">邮件类型</h2>
            <div className="space-y-2">
              {EMAIL_TYPES.map(et => (
                <button key={et.id} onClick={() => setType(et.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${type === et.id ? 'bg-blue-50 border-blue-400 text-blue-800' : 'border-gray-200 hover:border-blue-300 text-gray-700'}`}>
                  {et.label[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* Common fields */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <h2 className="font-semibold text-gray-700">基本信息</h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1">客户名</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={fields.customerName} onChange={e => set('customerName', e.target.value)} placeholder="例: 山田商事株式会社" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">负责人</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={fields.handler} onChange={e => set('handler', e.target.value)} />
            </div>

            {/* Type-specific fields */}
            {type === 'quote' && <>
              <div><label className="block text-xs text-gray-500 mb-1">货物名称</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={fields.cargo} onChange={e => set('cargo', e.target.value)} placeholder="例: 精密仪器" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs text-gray-500 mb-1">重量(kg)</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={fields.weight} onChange={e => set('weight', e.target.value)} placeholder="100" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">报价金额(CNY)</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={fields.amount} onChange={e => set('amount', e.target.value)} placeholder="5000" /></div>
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">有效期</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={fields.validity} onChange={e => set('validity', e.target.value)} placeholder="2026-05-31" /></div>
            </>}

            {type === 'arrival' && <>
              <div><label className="block text-xs text-gray-500 mb-1">AWB号</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={fields.awb} onChange={e => set('awb', e.target.value)} placeholder="999-12345678" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">到港日期</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={fields.arrivalDate} onChange={e => set('arrivalDate', e.target.value)} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">提货地点</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={fields.pickupLocation} onChange={e => set('pickupLocation', e.target.value)} /></div>
            </>}

            {type === 'delay' && <>
              <div><label className="block text-xs text-gray-500 mb-1">AWB号</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={fields.awb} onChange={e => set('awb', e.target.value)} placeholder="999-12345678" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs text-gray-500 mb-1">原定日期</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={fields.originalDate} onChange={e => set('originalDate', e.target.value)} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">新日期</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={fields.newDate} onChange={e => set('newDate', e.target.value)} /></div>
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">延误原因</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={fields.delayReason} onChange={e => set('delayReason', e.target.value)} placeholder="例: 天气原因导致航班取消" /></div>
            </>}

            {type === 'inquiry' && <div><label className="block text-xs text-gray-500 mb-1">咨询内容与回复</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 h-32"
                value={fields.inquiryContent} onChange={e => set('inquiryContent', e.target.value)}
                placeholder="请填写客户的咨询问题及您的回复内容..." /></div>}

            {type === 'thanks' && <div><label className="block text-xs text-gray-500 mb-1">合作内容</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={fields.cooperation} onChange={e => set('cooperation', e.target.value)}
                placeholder="例: 年度空运合作" /></div>}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">邮件预览</h2>
            <button onClick={copy}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-blue-700 text-white hover:bg-blue-800'}`}>
              {copied ? '✓ 已复制!' : '📋 一键复制'}
            </button>
          </div>
          <pre className="flex-1 bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed overflow-auto min-h-96">
            {emailText}
          </pre>
        </div>
      </div>
    </div>
  );
}
