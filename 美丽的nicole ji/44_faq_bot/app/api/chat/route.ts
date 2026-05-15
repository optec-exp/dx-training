import Groq from "groq-sdk";
import { NextRequest } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============================================================
// 公司内部知识库（System Prompt）
// 可以把这里替换成真实的公司规则和流程
// ============================================================
const COMPANY_KNOWLEDGE = `
【公司概况】
公司名称：OPTEC株式会社
业务内容：国际物流、航空货物代理
总部地址：东京都港区
员工人数：约150名

【工作规则】
- 工作时间：09:00〜18:00（含1小时休息）
- 弹性工时制：核心时间 10:00〜15:00
- 居家办公：每周最多2天（需提前申请）
- 加班：申请制（当天18:00前需获得上级批准）

【休假制度】
- 年次有薪假：入职6个月后发放10天，之后每年递增
- 申请方式：在Kintone的休假申请表单中，提前3天提交
- 特别假：婚假5天，丧假3〜5天
- 暑假：8月3天（公司指定日期）
- 年末年始：12月29日〜1月3日

【费用报销】
- 申请系统：使用Kintone的费用报销表单
- 申请截止：发生月份的次月5日前
- 收据要求：3万日元以上需提交原件，3万日元以下扫描件即可
- 交通费：优先使用IC交通工具，打车需事先获批
- 招待费：每人5,000日元以内（超出部分需单独申请）
- 打款日期：每月25日转账

【AWB・货物管理】
- AWB编号格式：XXX-XXXXXXXX（航空公司代码3位+8位数字）
- 追踪系统：在公司内部门户的「货物追踪」页面查看
- 延误报告：一旦确认超过ETA，立即联系客户
- 文件保管：AWB相关文件需保存7年

【IT系统・工具】
- 核心系统：Kintone（案件管理・申请表单）
- 邮件：Gmail（G Suite）
- 聊天：Slack
- 文件共享：Google Drive
- 视频会议：Google Meet
- 密码重置：联系IT支持（分机：1234）

【常见问题】
Q: 在哪里确认年假剩余天数？
A: 在Kintone的「我的页面」→「考勤信息」中确认。

Q: 居家办公如何申请？
A: 在Kintone的「居家办公申请」表单中，于前一天17:00前提交。

Q: 费用报销的审批人是谁？
A: 直属上级为第一审批人。5万日元以上还需部长追加审批。

Q: 健康保险卡丢失了怎么办？
A: 请联系总务部（分机：1100），将为您协助办理补发手续。

Q: 如何追踪货物状态？
A: 登录公司内部门户，点击「货物追踪」，输入AWB编号即可查看。
`;

// ============================================================

type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  const { messages } = await req.json() as { messages: Message[] };

  if (!messages || messages.length === 0) {
    return new Response("メッセージが空です", { status: 400 });
  }

  // 上下文窗口控制：最多保留最近20条对话（防止token超出）
  const recentMessages = messages.slice(-20);

  try {
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      stream: true,
      messages: [
        {
          role: "system",
          content: `你是OPTEC株式会社的社内FAQ助手。
请根据以下公司知识库，准确、友好地回答员工的问题。

回答规则：
1. 只根据知识库中的信息回答
2. 如果不清楚，回答「请联系相关部门确认」
3. 回答简洁明了，善用列表格式
4. 用中文回答（如果问题是日语则用日语回答）
5. 保持友善且专业的语气

===会社情報===
${COMPANY_KNOWLEDGE}
===ここまで===`,
        },
        ...recentMessages,
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content ?? "";
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("エラーが発生しました。しばらくしてから再試行してください。", {
      status: 500,
    });
  }
}
