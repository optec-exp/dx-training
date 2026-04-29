'use client'
import { useState, useMemo } from 'react'

type Lang = 'zh' | 'en' | 'ja'
type TemplateType = 'inquiry' | 'quote' | 'booking' | 'prealert' | 'arrival' | 'claim'

const LANGS = [{ code: 'zh' as Lang, label: '中文' }, { code: 'en' as Lang, label: 'EN' }, { code: 'ja' as Lang, label: '日本語' }]

const TYPES: { id: TemplateType; icon: string; label: Record<Lang, string>; sub: Record<Lang, string> }[] = [
  { id: 'inquiry',  icon: '🔍', label: { zh: '询价', en: 'Inquiry', ja: '見積依頼' },         sub: { zh: '向供应商询价', en: 'Rate inquiry', ja: 'レート問合せ' } },
  { id: 'quote',    icon: '💰', label: { zh: '报价', en: 'Quotation', ja: '見積回答' },        sub: { zh: '向客户报价', en: 'Quote reply', ja: '顧客への見積' } },
  { id: 'booking',  icon: '📋', label: { zh: '订舱确认', en: 'Booking Confirm', ja: '予約確認' }, sub: { zh: '确认舱位', en: 'Confirm booking', ja: '予約の確認' } },
  { id: 'prealert', icon: '✈',  label: { zh: '预报通知', en: 'Pre-Alert', ja: 'プリアラート' }, sub: { zh: '出货前通知', en: 'Shipment notice', ja: '出荷事前通知' } },
  { id: 'arrival',  icon: '📦', label: { zh: '到货通知', en: 'Arrival Notice', ja: '貨物到着案内' }, sub: { zh: '通知收货人', en: 'Notify consignee', ja: '到着ご案内' } },
  { id: 'claim',    icon: '⚠️', label: { zh: '索赔处理', en: 'Claim', ja: 'クレーム対応' },     sub: { zh: '货物异常处理', en: 'Cargo claim', ja: '貨物クレーム' } },
]

interface Fields {
  to: string; from: string; airline: string; awb: string
  origin: string; dest: string; etd: string; eta: string
  cargo: string; weight: string; cbm: string; remarks: string
}

const INIT: Fields = { to:'', from:'OPTEC Express', airline:'', awb:'', origin:'', dest:'', etd:'', eta:'', cargo:'', weight:'', cbm:'', remarks:'' }

function genTemplate(type: TemplateType, f: Fields, lang: Lang): string {
  const date = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
  const TO = f.to || (lang === 'ja' ? 'ご担当者様' : lang === 'zh' ? '尊敬的客户' : 'Dear Sir/Madam')
  const FROM = f.from || 'OPTEC Express'
  const AWB = f.awb ? `AWB: ${f.awb}` : ''
  const ROUTE = (f.origin && f.dest) ? `${f.origin} → ${f.dest}` : ''
  const ETD = f.etd ? (lang === 'ja' ? `出発日: ${f.etd}` : lang === 'zh' ? `出发日: ${f.etd}` : `ETD: ${f.etd}`) : ''
  const ETA = f.eta ? (lang === 'ja' ? `到着予定: ${f.eta}` : lang === 'zh' ? `预计到达: ${f.eta}` : `ETA: ${f.eta}`) : ''
  const CARGO = f.cargo ? (lang === 'ja' ? `品目: ${f.cargo}` : lang === 'zh' ? `货物: ${f.cargo}` : `Cargo: ${f.cargo}`) : ''
  const WEIGHT = f.weight ? (lang === 'ja' ? `重量: ${f.weight} kg` : lang === 'zh' ? `重量: ${f.weight} kg` : `Weight: ${f.weight} kg`) : ''
  const AIRLINE = f.airline ? (lang === 'ja' ? `航空会社: ${f.airline}` : lang === 'zh' ? `航空公司: ${f.airline}` : `Carrier: ${f.airline}`) : ''
  const details = [AWB, ROUTE, AIRLINE, ETD, ETA, CARGO, WEIGHT].filter(Boolean).join('\n')
  const REMARKS = f.remarks ? (lang === 'ja' ? `\n備考: ${f.remarks}` : lang === 'zh' ? `\n备注: ${f.remarks}` : `\nRemarks: ${f.remarks}`) : ''

  const T: Record<TemplateType, Record<Lang, string>> = {
    inquiry: {
      zh: `${TO}，\n\n感谢您的支持！\n\n我司有以下货物需要空运服务，请您提供报价：\n\n${details}${REMARKS}\n\n请提供详细运价及相关服务信息，如有任何问题欢迎联系。\n\n感谢配合！\n\n此致\n${FROM}\n${date}`,
      en: `${TO},\n\nI hope this email finds you well.\n\nWe would like to request a rate quotation for the following shipment:\n\n${details}${REMARKS}\n\nKindly provide your best rates and transit time at your earliest convenience.\n\nThank you for your assistance.\n\nBest regards,\n${FROM}\n${date}`,
      ja: `${TO}\n\nいつもお世話になっております。\n\n以下の貨物について、航空運賃の見積りをお願いいたします。\n\n${details}${REMARKS}\n\n折り返しご回答いただけますと幸いです。\nご不明な点がございましたら、お気軽にお問い合わせください。\n\nよろしくお願いいたします。\n${FROM}\n${date}`,
    },
    quote: {
      zh: `${TO}，\n\n感谢您的询价！请见以下报价：\n\n${details}${REMARKS}\n\n以上报价有效期为3个工作日。如需进一步信息或有任何疑问，请随时与我们联系。\n\n期待与您合作！\n\n此致\n${FROM}\n${date}`,
      en: `${TO},\n\nThank you for your inquiry. Please find our quotation below:\n\n${details}${REMARKS}\n\nThis quotation is valid for 3 business days. Please do not hesitate to contact us for further information.\n\nWe look forward to your confirmation.\n\nBest regards,\n${FROM}\n${date}`,
      ja: `${TO}\n\nこの度はお問い合わせいただき、ありがとうございます。\n以下の通りお見積りをご回答申し上げます。\n\n${details}${REMARKS}\n\n本見積りの有効期限は3営業日となっております。\nご不明な点がございましたら、お気軽にお問い合わせください。\n\nよろしくお願いいたします。\n${FROM}\n${date}`,
    },
    booking: {
      zh: `${TO}，\n\n您好！以下舱位预订已确认：\n\n${details}${REMARKS}\n\n请按时安排交货，如需变更请提前24小时告知。\n\n如有疑问，请联系我们。\n\n此致\n${FROM}\n${date}`,
      en: `${TO},\n\nWe are pleased to confirm the following booking:\n\n${details}${REMARKS}\n\nPlease ensure cargo is ready for collection as per the schedule above. Any changes must be notified at least 24 hours in advance.\n\nBest regards,\n${FROM}\n${date}`,
      ja: `${TO}\n\nご予約の確認をお送りいたします。\n\n${details}${REMARKS}\n\n上記スケジュールに合わせてお荷物のご準備をお願いいたします。\n変更がある場合は、24時間前までにご連絡ください。\n\nよろしくお願いいたします。\n${FROM}\n${date}`,
    },
    prealert: {
      zh: `${TO}，\n\n以下货物已出运，请查收预报信息：\n\n${details}${REMARKS}\n\n请做好到货准备及清关安排。如有问题请及时联系。\n\n此致\n${FROM}\n${date}`,
      en: `${TO},\n\nPlease be advised that the following shipment has been dispatched:\n\n${details}${REMARKS}\n\nKindly arrange customs clearance and delivery upon arrival. Please contact us if you need any additional documents.\n\nBest regards,\n${FROM}\n${date}`,
      ja: `${TO}\n\n以下の貨物が出荷されましたのでお知らせいたします。\n\n${details}${REMARKS}\n\n到着後の通関・配送手配をよろしくお願いいたします。\n書類等が必要な場合はお知らせください。\n\nよろしくお願いいたします。\n${FROM}\n${date}`,
    },
    arrival: {
      zh: `${TO}，\n\n您好！以下货物已抵达目的地：\n\n${details}${REMARKS}\n\n请尽快安排清关及提货。如需提单等文件，请告知。\n\n此致\n${FROM}\n${date}`,
      en: `${TO},\n\nWe are pleased to inform you that your cargo has arrived at destination:\n\n${details}${REMARKS}\n\nPlease arrange customs clearance and collection at your earliest convenience. Let us know if you require any documents.\n\nBest regards,\n${FROM}\n${date}`,
      ja: `${TO}\n\n貨物が目的地に到着いたしましたのでご案内申し上げます。\n\n${details}${REMARKS}\n\n通関・貨物の引き取り手配をお願いいたします。\n必要書類等がございましたらお知らせください。\n\nよろしくお願いいたします。\n${FROM}\n${date}`,
    },
    claim: {
      zh: `${TO}，\n\n您好！关于以下货物的异常情况，我们深表歉意：\n\n${details}${REMARKS}\n\n我们已启动索赔调查流程，请提供以下文件：\n1. 货物损坏/短少照片\n2. 清关相关文件\n3. 商业发票及装箱单\n\n我们将尽快处理此事，感谢您的理解与配合。\n\n此致\n${FROM}\n${date}`,
      en: `${TO},\n\nWe sincerely apologize for the issue with the following shipment:\n\n${details}${REMARKS}\n\nWe have initiated the claims process. To proceed, please provide:\n1. Photos of damaged/missing cargo\n2. Customs clearance documents\n3. Commercial invoice and packing list\n\nWe will handle this matter promptly. Thank you for your understanding.\n\nBest regards,\n${FROM}\n${date}`,
      ja: `${TO}\n\n以下の貨物に関するトラブルにより、ご迷惑をおかけし申し訳ございません。\n\n${details}${REMARKS}\n\nクレーム処理を開始いたしました。以下の書類をご提供いただけますようお願いいたします。\n1. 損傷・不足貨物の写真\n2. 通関書類\n3. インボイス・パッキングリスト\n\n迅速に対応いたします。ご理解のほどよろしくお願いいたします。\n${FROM}\n${date}`,
    },
  }
  return T[type][lang]
}

export default function Page() {
  const [lang, setLang] = useState<Lang>('zh')
  const [type, setType] = useState<TemplateType>('inquiry')
  const [fields, setFields] = useState<Fields>(INIT)
  const [copied, setCopied] = useState(false)

  const preview = useMemo(() => genTemplate(type, fields, lang), [type, fields, lang])

  const upd = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFields(p => ({ ...p, [k]: e.target.value }))

  const copy = () => {
    navigator.clipboard.writeText(preview)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const L = {
    zh: { h1: '邮件模板生成器', to: '收件人', from: '发件人/公司', airline: '航空公司', awb: 'AWB 号', origin: '出发地', dest: '目的地', etd: '出发日期', eta: '到达日期', cargo: '货物描述', weight: '重量 (kg)', cbm: '体积 (CBM)', remarks: '备注', preview: '邮件预览' },
    en: { h1: 'Email Template Generator', to: 'To', from: 'From / Company', airline: 'Carrier', awb: 'AWB No.', origin: 'Origin', dest: 'Destination', etd: 'ETD', eta: 'ETA', cargo: 'Cargo Description', weight: 'Weight (kg)', cbm: 'Volume (CBM)', remarks: 'Remarks', preview: 'Email Preview' },
    ja: { h1: 'メールテンプレート生成', to: '宛先', from: '差出人/会社', airline: '航空会社', awb: 'AWB番号', origin: '出発地', dest: '目的地', etd: '出発日', eta: '到着予定日', cargo: '品目', weight: '重量 (kg)', cbm: '容積 (CBM)', remarks: '備考', preview: 'メールプレビュー' },
  }[lang]

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="header-icon">✉</div>
          <span className="header-title">{L.h1}</span>
        </div>
        <div className="lang-switcher">
          {LANGS.map(l => <button key={l.code} className={`lang-btn${lang === l.code ? ' active' : ''}`} onClick={() => setLang(l.code)}>{l.label}</button>)}
        </div>
      </header>
      <div className="main">
        <div className="panel-left">
          <div className="section-title">{lang === 'zh' ? '邮件类型' : lang === 'en' ? 'Template Type' : 'テンプレート種別'}</div>
          <div className="type-grid">
            {TYPES.map(t => (
              <button key={t.id} className={`type-btn${type === t.id ? ' active' : ''}`} onClick={() => setType(t.id)}>
                <div className="type-btn-icon">{t.icon}</div>
                <div className="type-btn-label">{t.label[lang]}</div>
                <div className="type-btn-sub">{t.sub[lang]}</div>
              </button>
            ))}
          </div>
          <div className="section-title">{lang === 'zh' ? '填写信息' : lang === 'en' ? 'Fill Details' : '情報を入力'}</div>
          {([['to', L.to], ['from', L.from], ['airline', L.airline], ['awb', L.awb], ['origin', L.origin], ['dest', L.dest], ['etd', L.etd], ['eta', L.eta], ['cargo', L.cargo], ['weight', L.weight]] as [keyof Fields, string][]).map(([k, label]) => (
            <div className="field" key={k}>
              <label>{label}</label>
              <input type={k === 'etd' || k === 'eta' ? 'date' : 'text'} value={fields[k]} onChange={upd(k)} placeholder={k === 'to' ? (lang === 'ja' ? 'ご担当者様' : lang === 'zh' ? '收件人姓名' : 'Recipient name') : ''} />
            </div>
          ))}
          <div className="field">
            <label>{L.remarks}</label>
            <textarea value={fields.remarks} onChange={upd('remarks')} rows={3} />
          </div>
        </div>
        <div className="panel-right">
          <div className="preview-card">
            <div className="preview-header">
              <span className="preview-title">{L.preview}</span>
              <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copy}>
                {copied ? '✓ ' + (lang === 'zh' ? '已复制' : lang === 'en' ? 'Copied' : 'コピー済') : '⧉ ' + (lang === 'zh' ? '复制' : lang === 'en' ? 'Copy' : 'コピー')}
              </button>
            </div>
            <div className="preview-body">{preview}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
