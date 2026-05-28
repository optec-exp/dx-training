import { Type } from "@google/genai";

export interface EmailInput {
  points: string;
  purpose: string;
  relation: string;
  tone: string;
  recipient?: string;
  signature?: string;
}

// 系统指令：定义 AI 的"身份"和每种语言的商务写作规范。
export const SYSTEM_INSTRUCTION = `你是一位精通日语、英语、中文三国商务礼仪的资深商务文书专家。
任务：根据用户提供的【邮件要点】和【上下文】，撰写一封可以直接发送的正式商务邮件，并同时输出日语、英语、中文三个版本。

通用要求：
1. 三个版本表达同一件事，但各自符合该语言的商务习惯，不是逐字直译。
2. 每个版本都包含合适的【主题】和【正文】。
3. 正文结构完整：称呼 → 开场寒暄 → 正文 → 结尾礼貌用语 → 署名。
4. 语气专业、礼貌、得体，避免口语和情绪化表达。
5. 只根据要点写作，不要编造要点中没有的具体事实（如金额、日期）。
6. 【最高优先级·严禁占位符】输出中绝对禁止出现任何需要用户手动填空的占位符，包括方括号 [人名]/[项目名称]/[Manager's Name/Title]，以及日文的 〇〇 / ○○ / ××、英文的 XX 等符号。出现任何一个都视为严重错误。
   - 收件人称呼缺失时，必须写出完整、得体的实际通用称呼，按关系选择：
     · 客户 → 日「お客様各位」/ 英「Dear Valued Customer,」/ 中「尊敬的客户：」
     · 上司·领导 → 日（省略姓名，直接以「いつもお世話になっております」开头）/ 英「Dear Sir/Madam,」/ 中「尊敬的领导：」
     · 同事·下属 → 日「関係者各位」/ 英「Dear Colleague,」/ 中「各位同事：」
     · 供应商·合作方·初次联系 → 日「ご担当者様」/ 英「Dear Sir/Madam,」/ 中「尊敬的合作伙伴：」
   - 项目名、金额、日期等具体信息缺失时，用自然笼统的表达（「本次项目」「贵公司」「近期」），绝不留括号或填空位。
   - 正文中提及收件人本人时，一律使用第二人称敬称（中：您；日：貴殿 / あなた様，或省略主语；英：you），严禁出现其姓名、职位占位或「〇〇様」「（上司の名前）」这类括号填空。

各语言细则：
- 日语：以「です・ます」体为基础，按收件人关系适度使用尊敬語/謙譲語。遵循日式商务惯例（开头如「いつもお世話になっております」，结尾如「何卒よろしくお願い申し上げます」）。
- 英语：使用正式商务英语，清晰、礼貌、简洁。称呼如「Dear ...,」，结尾如「Best regards,」。
- 中文：使用得体的商务中文，称呼得当（如「尊敬的××」），结尾礼貌（如「此致 敬礼」「顺颂商祺」）。

根据【语气】调整郑重程度，根据【收件人关系】调整敬语与称呼层级。`;

// Few-shot 范例：给 AI 看一组"标准输入 → 理想输出"，锚定三语的语气与格式。
const EXAMPLE_INPUT = `【邮件要点】因系统维护，本周六 22:00 至周日 06:00 服务暂停，提前告知客户并致歉，维护后服务自动恢复。
【邮件目的】通知 / 告知
【收件人关系】客户
【收件人称呼】（未提供，请使用得体的通用称呼）
【语气】标准商务
【署名】Optec / 客户支持团队`;

const EXAMPLE_OUTPUT = JSON.stringify({
  japanese: {
    subject: "【メンテナンスのお知らせ】システム一時停止について",
    body: "お客様各位\n\nいつも格別のご高配を賜り、誠にありがとうございます。\n\nこの度、システムメンテナンスのため、下記の時間帯にサービスを一時停止させていただきます。\n\n停止時間：今週土曜日 22:00 ～ 日曜日 06:00\n\nご利用のお客様にはご不便をおかけいたしますことを、深くお詫び申し上げます。メンテナンス完了後、サービスは自動的に復旧いたします。\n\n何卒ご理解賜りますよう、よろしくお願い申し上げます。\n\nOptec カスタマーサポートチーム",
  },
  english: {
    subject: "Scheduled System Maintenance Notice",
    body: "Dear Valued Customer,\n\nThank you for your continued support.\n\nPlease be informed that our service will be temporarily unavailable due to scheduled system maintenance during the following period:\n\nSaturday 22:00 - Sunday 06:00\n\nWe sincerely apologize for any inconvenience this may cause. The service will resume automatically once the maintenance is complete.\n\nThank you for your understanding.\n\nBest regards,\nOptec Customer Support Team",
  },
  chinese: {
    subject: "系统维护通知：服务临时暂停",
    body: "尊敬的客户：\n\n您好！一直以来承蒙贵司支持，谨致谢忱。\n\n因系统维护需要，我司服务将于以下时间段临时暂停：\n\n本周六 22:00 至周日 06:00\n\n由此给您带来的不便，我们深表歉意。维护完成后，服务将自动恢复，敬请知悉。\n\n感谢您的理解与支持。\n\n此致\n敬礼\n\nOptec 客户支持团队",
  },
});

function formatInput(input: EmailInput): string {
  return `【邮件要点】${input.points}
【邮件目的】${input.purpose}
【收件人关系】${input.relation}
【收件人称呼】${
    input.recipient?.trim() ||
    "（未提供，请使用得体的通用称呼，如「お客様各位」「Dear Sir/Madam」「尊敬的客户」）"
  }
【语气】${input.tone}
【署名】${input.signature?.trim() || "（未提供，请使用通用署名占位）"}`;
}

// 构造多轮对话：先放一组 Few-shot 示例（user→model），再放本次真实请求。
export function buildContents(input: EmailInput) {
  return [
    { role: "user", parts: [{ text: EXAMPLE_INPUT }] },
    { role: "model", parts: [{ text: EXAMPLE_OUTPUT }] },
    { role: "user", parts: [{ text: formatInput(input) }] },
  ];
}

// 输出结构：强制 AI 返回固定 JSON 形状，方便前端分语言展示。
const langSchema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING },
    body: { type: Type.STRING },
  },
  required: ["subject", "body"],
};

export const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    japanese: langSchema,
    english: langSchema,
    chinese: langSchema,
  },
  required: ["japanese", "english", "chinese"],
  propertyOrdering: ["japanese", "english", "chinese"],
};

// ---- 代码兜底：清洗模型偶尔输出的占位符 ----
// 弱模型在未提供收件人姓名时，常塞入 [姓名] 或 〇〇 这类填空占位符。
// 这里按收件人关系，强制替换为得体的通用称呼，保证输出可直接使用。

type Lang = "ja" | "en" | "zh";

const RELATION_GREETING: { key: string; ja: string; en: string; zh: string }[] =
  [
    { key: "客户", ja: "お客様各位", en: "Dear Valued Customer,", zh: "尊敬的客户：" },
    { key: "上司", ja: "関係者各位", en: "Dear Sir/Madam,", zh: "尊敬的领导：" },
    { key: "同事", ja: "関係者各位", en: "Dear Colleague,", zh: "各位同事：" },
    { key: "下属", ja: "関係者各位", en: "Dear Colleague,", zh: "各位同事：" },
    { key: "供应商", ja: "ご担当者様", en: "Dear Sir/Madam,", zh: "尊敬的合作伙伴：" },
    { key: "合作", ja: "ご担当者様", en: "Dear Sir/Madam,", zh: "尊敬的合作伙伴：" },
    { key: "初次", ja: "ご担当者様", en: "Dear Sir/Madam,", zh: "尊敬的合作伙伴：" },
  ];

// 占位符特征：方括号 [..]、连续的 〇○×Ｘ 符号
const PLACEHOLDER = /\[[^\]\n]*\]|[〇○]{2,}|[×ＸX]{2,}/;

function greetingFor(relation: string, lang: Lang): string {
  const hit =
    RELATION_GREETING.find((r) => relation.includes(r.key)) ??
    RELATION_GREETING[0];
  return hit[lang];
}

function sanitizeBody(body: string, relation: string, lang: Lang): string {
  const lines = body.split("\n");
  const firstIdx = lines.findIndex((l) => l.trim() !== "");
  // 称呼行（首个非空行）若含占位符，整行替换为通用称呼
  if (firstIdx >= 0 && PLACEHOLDER.test(lines[firstIdx])) {
    lines[firstIdx] = greetingFor(relation, lang);
  }
  // 清除正文其余位置残留的方括号 / 〇〇 / ×× 占位
  return lines
    .join("\n")
    .replace(/\[[^\]\n]*\]/g, "")
    .replace(/[〇○]{2,}|[×ＸX]{2,}/g, "")
    .replace(/[ \t]{2,}/g, " ");
}

export function sanitizeEmail(
  email: LangEmail,
  relation: string,
  lang: Lang
): LangEmail {
  return {
    subject: email.subject.replace(/\[[^\]\n]*\]/g, "").replace(/\s{2,}/g, " ").trim(),
    body: sanitizeBody(email.body, relation, lang),
  };
}

interface LangEmail {
  subject: string;
  body: string;
}
