'use client';

import { useState, useMemo } from 'react';

// ── 型定義 ────────────────────────────────────────────────────────
type EmailType = 'quote' | 'arrival' | 'delay' | 'inquiry' | 'thanks';
type Lang = 'zh' | 'ja' | 'en';

interface Fields {
  customerName:   string;
  awb:            string;
  cargo:          string;
  quote:          string;
  validity:       string;
  arrivalDate:    string;
  pickupLocation: string;
  originalDate:   string;
  newDate:        string;
  delayReason:    string;
  origin:         string;
  destination:    string;
  planName:       string;
  executionDate:  string;
  handler:        string;
  notes:          string;
}

const INITIAL: Fields = {
  customerName: '', awb: '', cargo: '', quote: '', validity: '',
  arrivalDate: '', pickupLocation: '', originalDate: '', newDate: '',
  delayReason: '', origin: '', destination: '', planName: '',
  executionDate: '', handler: '', notes: '',
};

// ── メールタイプ定義 ──────────────────────────────────────────────
const EMAIL_TYPES: { id: EmailType; zh: string; icon: string; color: string }[] = [
  { id: 'quote',   zh: '报价回复', icon: '💰', color: '#3b82f6' },
  { id: 'arrival', zh: '到货通知', icon: '📦', color: '#10b981' },
  { id: 'delay',   zh: '延误道歉', icon: '⚠️', color: '#f97316' },
  { id: 'inquiry', zh: '询价回复', icon: '🔍', color: '#8b5cf6' },
  { id: 'thanks',  zh: '感谢确认', icon: '✅', color: '#06b6d4' },
];

// ── 各タイプで表示するフォームフィールド ─────────────────────────
type FieldKey = keyof Fields;

const TYPE_FIELDS: Record<EmailType, FieldKey[]> = {
  quote:   ['customerName', 'cargo', 'quote', 'validity', 'notes'],
  arrival: ['customerName', 'awb', 'cargo', 'arrivalDate', 'pickupLocation', 'notes'],
  delay:   ['customerName', 'awb', 'delayReason', 'originalDate', 'newDate', 'notes'],
  inquiry: ['customerName', 'origin', 'destination', 'cargo', 'quote', 'notes'],
  thanks:  ['customerName', 'planName', 'executionDate', 'notes'],
};

// ── フィールドラベル（三ヶ国語）────────────────────────────────
const LABELS: Record<FieldKey, Record<Lang, { label: string; placeholder: string; multiline?: boolean }>> = {
  customerName:   { zh: { label: '客户名', placeholder: '例：山田物流株式会社' }, ja: { label: '宛先（お客様名）', placeholder: '例：山田物流株式会社' }, en: { label: 'Customer Name', placeholder: 'e.g. Yamada Logistics Co., Ltd.' } },
  awb:            { zh: { label: 'AWB 号码', placeholder: '例：CA 123-45678901' }, ja: { label: 'AWB番号', placeholder: '例：CA 123-45678901' }, en: { label: 'AWB No.', placeholder: 'e.g. CA 123-45678901' } },
  cargo:          { zh: { label: '货物内容', placeholder: '例：精密机器（电子部品）' }, ja: { label: '貨物内容', placeholder: '例：精密機器（電子部品）' }, en: { label: 'Cargo Description', placeholder: 'e.g. Precision Equipment' } },
  quote:          { zh: { label: '报价', placeholder: '例：JPY 850/kg（最低 5,000円）' }, ja: { label: 'お見積り金額', placeholder: '例：JPY 850/kg（最低 5,000円）' }, en: { label: 'Quotation', placeholder: 'e.g. JPY 850/kg (Min. JPY 5,000)' } },
  validity:       { zh: { label: '有效期', placeholder: '例：2026-05-31' }, ja: { label: '有効期限', placeholder: '例：2026年5月31日' }, en: { label: 'Valid Until', placeholder: 'e.g. May 31, 2026' } },
  arrivalDate:    { zh: { label: '到达时间', placeholder: '例：2026-05-02 14:00' }, ja: { label: '到着日時', placeholder: '例：2026年5月2日 14:00' }, en: { label: 'Arrival Date & Time', placeholder: 'e.g. May 2, 2026, 14:00' } },
  pickupLocation: { zh: { label: '提货地点', placeholder: '例：NRT 货站 A 号仓库' }, ja: { label: '引き取り場所', placeholder: '例：成田空港 貨物ターミナル A棟' }, en: { label: 'Pickup Location', placeholder: 'e.g. NRT Cargo Terminal, Warehouse A' } },
  originalDate:   { zh: { label: '原定日期', placeholder: '例：2026-05-01' }, ja: { label: '当初予定日', placeholder: '例：2026年5月1日' }, en: { label: 'Original Date', placeholder: 'e.g. May 1, 2026' } },
  newDate:        { zh: { label: '新预计日期', placeholder: '例：2026-05-04' }, ja: { label: '新しい予定日', placeholder: '例：2026年5月4日' }, en: { label: 'New Estimated Date', placeholder: 'e.g. May 4, 2026' } },
  delayReason:    { zh: { label: '延误原因', placeholder: '例：航班取消（恶劣天气）' }, ja: { label: '遅延原因', placeholder: '例：フライトキャンセル（悪天候）' }, en: { label: 'Reason for Delay', placeholder: 'e.g. Flight cancellation due to bad weather' } },
  origin:         { zh: { label: '出发地', placeholder: '例：上海（PVG）' }, ja: { label: '出発地', placeholder: '例：上海（PVG）' }, en: { label: 'Origin', placeholder: 'e.g. Shanghai (PVG)' } },
  destination:    { zh: { label: '目的地', placeholder: '例：东京（NRT）' }, ja: { label: '目的地', placeholder: '例：東京（NRT）' }, en: { label: 'Destination', placeholder: 'e.g. Tokyo (NRT)' } },
  planName:       { zh: { label: '确认内容', placeholder: '例：PVG→NRT 精密机器空运方案' }, ja: { label: 'ご確認内容', placeholder: '例：PVG→NRT 精密機器エアフレイト' }, en: { label: 'Confirmed Plan', placeholder: 'e.g. PVG→NRT Air Freight for Precision Equipment' } },
  executionDate:  { zh: { label: '预计执行日期', placeholder: '例：2026-05-10' }, ja: { label: '予定実施日', placeholder: '例：2026年5月10日' }, en: { label: 'Scheduled Date', placeholder: 'e.g. May 10, 2026' } },
  handler:        { zh: { label: '发件人 / 署名', placeholder: '例：Nicole Ji' }, ja: { label: '担当者名', placeholder: '例：Nicole Ji' }, en: { label: 'Your Name / Sender', placeholder: 'e.g. Nicole Ji' } },
  notes:          { zh: { label: '备注（选填）', placeholder: '其他需要说明的事项…', multiline: true }, ja: { label: '備考（任意）', placeholder: 'その他ご連絡事項…', multiline: true }, en: { label: 'Additional Notes (Optional)', placeholder: 'Any other information…', multiline: true } },
};

// ── メール本文生成関数 ────────────────────────────────────────────
function generate(type: EmailType, lang: Lang, f: Fields): { subject: string; body: string } {
  const note = f.notes.trim()
    ? (lang === 'zh' ? `■ 备注：${f.notes}` : lang === 'ja' ? `■ 備考：${f.notes}` : `■ Note: ${f.notes}`)
    : '';
  const sig =
    lang === 'zh' ? `${f.handler || '担当者'}\nOPTEC Express\nDX室\nEmail: info@optec-exp.com` :
    lang === 'ja' ? `${f.handler || '担当者'}\nOPTEC Express 株式会社\nDX室\nEmail: info@optec-exp.com` :
                   `${f.handler || 'Your Name'}\nOPTEC Express Co., Ltd.\nDX Team\nEmail: info@optec-exp.com`;

  // ── 報価回复 ──
  if (type === 'quote') {
    if (lang === 'zh') return {
      subject: `【报价回复】${f.cargo || '货物'} 航空运费报价`,
      body:
`尊敬的 ${f.customerName || '___'} 先生/女士，

感谢您的垂询。
现就您咨询的货物运费，提供如下报价，敬请参考：

■ 货物内容：${f.cargo || '___'}
■ 报　　价：${f.quote || '___'}
■ 有 效 期：${f.validity || '___'}
${note}

如有疑问，欢迎随时联系。期待与您的合作。

---
${sig}`,
    };
    if (lang === 'ja') return {
      subject: `【お見積り回答】${f.cargo || '貨物'} 航空運賃のご案内`,
      body:
`${f.customerName || '___'} 様

平素よりお世話になっております。
このたびはお問い合わせいただき、誠にありがとうございます。

ご依頼いただきました航空運賃のお見積りをご案内申し上げます。

■ 貨物内容：${f.cargo || '___'}
■ お見積り：${f.quote || '___'}
■ 有効期限：${f.validity || '___'}
${note}

ご不明な点がございましたら、お気軽にお問い合わせください。
何卒よろしくお願い申し上げます。

---
${sig}`,
    };
    return {
      subject: `[Quotation] Air Freight Rate for ${f.cargo || 'Cargo'}`,
      body:
`Dear ${f.customerName || '___'},

Thank you for your inquiry.
Please find our quotation as follows:

■ Cargo:       ${f.cargo || '___'}
■ Quotation:   ${f.quote || '___'}
■ Valid Until: ${f.validity || '___'}
${note}

Please feel free to contact us should you have any questions.
We look forward to working with you.

Best regards,
---
${sig}`,
    };
  }

  // ── 到货通知 ──
  if (type === 'arrival') {
    if (lang === 'zh') return {
      subject: `【到货通知】${f.awb || 'AWB'} 货物已到达`,
      body:
`尊敬的 ${f.customerName || '___'} 先生/女士，

您好！您委托的货物已安全到达，请查看以下详情：

■ AWB 号码：${f.awb || '___'}
■ 货物内容：${f.cargo || '___'}
■ 到达时间：${f.arrivalDate || '___'}
■ 提货地点：${f.pickupLocation || '___'}
${note}

请携带相关单据按时提货，如有疑问请随时联系我们。

---
${sig}`,
    };
    if (lang === 'ja') return {
      subject: `【入荷のご案内】${f.awb || 'AWB'} 貨物到着のお知らせ`,
      body:
`${f.customerName || '___'} 様

平素よりお世話になっております。
ご依頼の貨物が到着しましたのでご案内申し上げます。

■ AWB番号：${f.awb || '___'}
■ 貨物内容：${f.cargo || '___'}
■ 到着日時：${f.arrivalDate || '___'}
■ 引き取り場所：${f.pickupLocation || '___'}
${note}

お引き取りの際は事前にご連絡いただけますと幸いです。
何卒よろしくお願い申し上げます。

---
${sig}`,
    };
    return {
      subject: `[Arrival Notice] ${f.awb || 'AWB'} – Your Cargo Has Arrived`,
      body:
`Dear ${f.customerName || '___'},

We are pleased to inform you that your shipment has arrived.

■ AWB No.:         ${f.awb || '___'}
■ Cargo:           ${f.cargo || '___'}
■ Arrival Date:    ${f.arrivalDate || '___'}
■ Pickup Location: ${f.pickupLocation || '___'}
${note}

Please bring the original documents when collecting the cargo.
Do not hesitate to contact us if you need assistance.

Best regards,
---
${sig}`,
    };
  }

  // ── 延误道歉 ──
  if (type === 'delay') {
    if (lang === 'zh') return {
      subject: `【重要】${f.awb || 'AWB'} 货物延误通知及致歉`,
      body:
`尊敬的 ${f.customerName || '___'} 先生/女士，

首先，我们对此次延误给您带来的不便深表歉意。

■ AWB 号码：${f.awb || '___'}
■ 延误原因：${f.delayReason || '___'}
■ 原定日期：${f.originalDate || '___'}
■ 最新预计日期：${f.newDate || '___'}
${note}

我们正在全力跟进，确保货物尽快到达。如有最新进展，我们将第一时间通知您。
再次对此次延误深感抱歉，敬请谅解。

---
${sig}`,
    };
    if (lang === 'ja') return {
      subject: `【重要・遅延のお詫び】${f.awb || 'AWB'} 貨物遅延のご連絡`,
      body:
`${f.customerName || '___'} 様

平素よりお世話になっております。
この度は、ご依頼の貨物に遅延が生じましたことを心よりお詫び申し上げます。

■ AWB番号：${f.awb || '___'}
■ 遅延原因：${f.delayReason || '___'}
■ 当初予定日：${f.originalDate || '___'}
■ 新しい予定日：${f.newDate || '___'}
${note}

現在、早急な解決に向けて対応しております。進捗があり次第、改めてご連絡いたします。
ご迷惑をおかけしておりますことを重ねてお詫び申し上げます。

---
${sig}`,
    };
    return {
      subject: `[Important] Shipment Delay Notice – ${f.awb || 'AWB'}`,
      body:
`Dear ${f.customerName || '___'},

We sincerely apologize for the inconvenience caused by the delay of your shipment.

■ AWB No.:             ${f.awb || '___'}
■ Reason for Delay:    ${f.delayReason || '___'}
■ Original Date:       ${f.originalDate || '___'}
■ New Estimated Date:  ${f.newDate || '___'}
${note}

We are actively working to resolve this as soon as possible and will keep you updated.
Once again, we apologize for any disruption this may have caused.

Best regards,
---
${sig}`,
    };
  }

  // ── 询价回复 ──
  if (type === 'inquiry') {
    if (lang === 'zh') return {
      subject: `【询价回复】${f.origin || '___'}→${f.destination || '___'} 航空货运参考报价`,
      body:
`尊敬的 ${f.customerName || '___'} 先生/女士，

感谢您的询价！以下是我们针对您需求的参考报价：

■ 出 发 地：${f.origin || '___'}
■ 目 的 地：${f.destination || '___'}
■ 货物内容：${f.cargo || '___'}
■ 参考运费：${f.quote || '___'}
${note}

如需正式报价，请提供货物详细信息（重量/尺寸/件数），我们将尽快为您提供精确报价。

---
${sig}`,
    };
    if (lang === 'ja') return {
      subject: `【お問い合わせ回答】${f.origin || '___'}→${f.destination || '___'} 航空貨物運賃のご案内`,
      body:
`${f.customerName || '___'} 様

平素よりお世話になっております。
お問い合わせいただきありがとうございます。

以下の通り、参考運賃をご案内申し上げます。

■ 出発地：${f.origin || '___'}
■ 目的地：${f.destination || '___'}
■ 貨物内容：${f.cargo || '___'}
■ 参考運賃：${f.quote || '___'}
${note}

正式なお見積りをご希望の場合は、貨物の詳細（重量・サイズ・個数）をお知らせください。
よろしくお願い申し上げます。

---
${sig}`,
    };
    return {
      subject: `[Inquiry Reply] Air Freight Rate – ${f.origin || '___'} to ${f.destination || '___'}`,
      body:
`Dear ${f.customerName || '___'},

Thank you for your inquiry. Please find the reference rate below:

■ Origin:         ${f.origin || '___'}
■ Destination:    ${f.destination || '___'}
■ Cargo:          ${f.cargo || '___'}
■ Reference Rate: ${f.quote || '___'}
${note}

For a formal quotation, please provide detailed cargo information (weight, dimensions, pieces).
We look forward to your response.

Best regards,
---
${sig}`,
    };
  }

  // ── 感谢确认 ──
  if (lang === 'zh') return {
    subject: `【感谢确认】${f.planName || '方案'} — 感谢您的信任`,
    body:
`尊敬的 ${f.customerName || '___'} 先生/女士，

非常感谢您确认本次方案！
我们已收到您的确认，将按照以下安排认真执行：

■ 确认内容：${f.planName || '___'}
■ 预计执行日期：${f.executionDate || '___'}
${note}

请放心，我们将全力确保顺利完成。如有任何问题，欢迎随时联系。
再次感谢您的信任与支持！

---
${sig}`,
  };
  if (lang === 'ja') return {
    subject: `【ご確認のお礼】${f.planName || 'ご依頼内容'} ご発注ありがとうございます`,
    body:
`${f.customerName || '___'} 様

平素よりお世話になっております。
このたびはご確認・ご発注いただき、誠にありがとうございます。

内容を確認し、確実に対応させていただきます。

■ ご依頼内容：${f.planName || '___'}
■ 予定実施日：${f.executionDate || '___'}
${note}

ご不明な点がございましたら、いつでもお気軽にお申し付けください。
引き続きどうぞよろしくお願い申し上げます。

---
${sig}`,
  };
  return {
    subject: `[Confirmation] Thank You for Confirming – ${f.planName || 'Your Order'}`,
    body:
`Dear ${f.customerName || '___'},

Thank you for confirming the arrangement.
We have received your confirmation and will proceed as planned.

■ Confirmed Plan:   ${f.planName || '___'}
■ Scheduled Date:   ${f.executionDate || '___'}
${note}

Please feel free to reach out if you have any questions.
We appreciate your trust and look forward to serving you.

Best regards,
---
${sig}`,
  };
}

// ── カラー定数 ────────────────────────────────────────────────────
const C = {
  bg: '#030b18', bg2: '#071428', bg3: '#0d1f3c',
  border: 'rgba(255,255,255,0.1)', text: '#e2e8f0',
  muted: '#94a3b8', sky: '#60a5fa',
};

// ── メインコンポーネント ───────────────────────────────────────────
export default function EmailTemplate() {
  const [emailType, setEmailType] = useState<EmailType>('quote');
  const [lang, setLang]           = useState<Lang>('zh');
  const [fields, setFields]       = useState<Fields>(INITIAL);
  const [copied, setCopied]       = useState(false);

  function set(key: FieldKey, value: string) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  // ── useMemo: フォームの値が変わるたびにメールを再生成 ──────────
  const email = useMemo(() => generate(emailType, lang, fields), [emailType, lang, fields]);

  const fullText = `Subject: ${email.subject}\n\n${email.body}`;

  function copyToClipboard() {
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const activeType = EMAIL_TYPES.find(t => t.id === emailType)!;
  const shownFields = TYPE_FIELDS[emailType];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg, color: C.text, fontFamily: "'Inter','PingFang SC','Microsoft YaHei',sans-serif", overflow: 'hidden' }}>

      {/* ── Header ── */}
      <header style={{ background: C.bg2, borderBottom: `1px solid ${C.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: 3, color: C.sky, textTransform: 'uppercase', marginBottom: 2 }}>OPTEC Express</p>
          <h1 style={{ fontSize: 19, fontWeight: 700 }}>邮件模板生成器</h1>
        </div>
        <p style={{ fontSize: 12, color: C.muted, marginLeft: 'auto' }}>中文 · 日本語 · English — 5种业务邮件一键生成</p>
      </header>

      {/* ── Email Type Tabs ── */}
      <div style={{ background: C.bg2, borderBottom: `1px solid ${C.border}`, padding: '10px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {EMAIL_TYPES.map(t => {
            const isActive = emailType === t.id;
            return (
              <button key={t.id} type="button"
                onClick={() => { setEmailType(t.id); setFields(INITIAL); }}
                style={{
                  flexShrink: 0, padding: '8px 18px', borderRadius: 22,
                  border: `2px solid ${isActive ? t.color : 'rgba(255,255,255,0.15)'}`,
                  background: isActive ? t.color + '28' : 'transparent',
                  color: isActive ? t.color : C.muted,
                  cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 700 : 400,
                  outline: 'none', whiteSpace: 'nowrap', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span>{t.icon}</span>{t.zh}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main: Form + Preview ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left: Form ── */}
        <div style={{ width: '42%', overflowY: 'auto', padding: '18px 16px', borderRight: `1px solid ${C.border}` }}>

          {/* Language Selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {([['zh','中文'],['ja','日本語'],['en','English']] as [Lang,string][]).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setLang(id)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${lang === id ? C.sky : 'rgba(255,255,255,0.15)'}`,
                  background: lang === id ? C.sky + '22' : 'transparent',
                  color: lang === id ? C.sky : C.muted,
                  fontSize: 13, fontWeight: lang === id ? 700 : 400, outline: 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Dynamic Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...shownFields, 'handler' as FieldKey].map(key => {
              const lbl = LABELS[key][lang];
              return (
                <div key={key}>
                  <p style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>{lbl.label}</p>
                  {lbl.multiline ? (
                    <textarea
                      value={fields[key]}
                      onChange={e => set(key, e.target.value)}
                      placeholder={lbl.placeholder}
                      rows={3}
                      style={{
                        width: '100%', padding: '9px 11px', background: C.bg3,
                        border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 8,
                        color: C.text, fontSize: 13, outline: 'none', resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={fields[key]}
                      onChange={e => set(key, e.target.value)}
                      placeholder={lbl.placeholder}
                      style={{
                        width: '100%', padding: '9px 11px', background: C.bg3,
                        border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 8,
                        color: C.text, fontSize: 13, outline: 'none',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Generated Email Preview ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Preview Header */}
          <div style={{
            background: C.bg2, borderBottom: `1px solid ${C.border}`,
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            <span style={{ fontSize: 16 }}>{activeType.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: activeType.color }}>{activeType.zh}</span>
            <span style={{ fontSize: 12, color: C.muted }}>· {lang === 'zh' ? '中文版' : lang === 'ja' ? '日本語版' : 'English'}</span>
            <button type="button" onClick={copyToClipboard}
              style={{
                marginLeft: 'auto', padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
                background: copied ? '#10b981' : activeType.color,
                border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, outline: 'none',
                transition: 'background 0.2s',
              }}
            >
              {copied ? '✓ 已复制！' : '📋 复制邮件'}
            </button>
          </div>

          {/* Subject Line */}
          <div style={{ padding: '12px 18px', background: C.bg3, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: C.muted, marginRight: 8 }}>Subject / 件名：</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{email.subject}</span>
          </div>

          {/* Email Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
            <pre style={{
              fontSize: 13, lineHeight: 1.8, color: C.text,
              fontFamily: "'Courier New', 'Noto Sans Mono', monospace",
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
            }}>
              {email.body}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
