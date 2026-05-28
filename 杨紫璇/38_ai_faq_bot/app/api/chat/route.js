import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const COMPANY_KNOWLEDGE = `
# OPTEC 公司内部知识库

## 一、公司基本信息
- 公司全名：OPTEC 国际物流株式会社（OPTEC International Logistics Co., Ltd.）
- 成立时间：2014 年
- 总部：日本东京都港区
- 主营业务：国际航空货运、海运、仓储配送、供应链解决方案
- 全球网点：覆盖 96 个国家和地区，简称 TALA Network
- 员工人数：全球约 1200 人

## 二、办公时间与考勤
- 标准上班时间：周一至周五，09:00 - 18:00（含 1 小时午休）
- 打卡方式：使用公司钉钉或指纹打卡机
- 迟到规定：迟到 15 分钟内不扣薪，30 分钟以上算半天事假
- 加班政策：
  - 工作日加班：1.5 倍工资
  - 周末加班：2 倍工资
  - 法定节假日加班：3 倍工资
  - 加班需提前提交申请并经直属主管批准

## 三、请假流程
### 年假
- 入职满 1 年：5 天/年；满 3 年：10 天/年；满 5 年：15 天/年
- 申请方式：HR 系统提交 → 主管审批 → HR 备案
- 至少提前 3 个工作日申请

### 病假
- 1 天内：可口头报备，事后补单
- 2 天以上：需提供医院诊断证明
- 全年不超过 10 天

### 事假
- 全年累计不超过 7 天，需提前 1 个工作日申请，不计薪

### 婚假、产假、丧假
- 婚假：10 天（含周末）
- 产假：158 天
- 丧假：直系亲属 5 天，旁系 3 天

## 四、报销流程
1. 出差/采购前，先在系统提交预算申请
2. 主管批准后方可执行
3. 保留所有发票（必须是公司抬头）
4. 回公司后 7 个工作日内在系统提交报销单
5. 财务审核 → 主管复核 → 3~5 个工作日内打款到工资卡
6. 单笔超过 5000 元需总经理审批

## 五、IT 设备与权限
- 办公电脑：入职当天由 IT 部门发放笔记本
- 设备申请：通过 IT 服务台 it-help@optec.example 提交工单
- 密码重置：联系 IT 部门，或自助系统重置
- 公司 Wi-Fi：SSID OPTEC-STAFF，密码每季度更新一次
- VPN：远程办公需先申请 VPN 权限

## 六、福利与培训
- 五险一金：按当地最高标准缴纳
- 商业保险：补充医疗保险
- 餐补：每月 600 元，随工资发放
- 节日礼金：春节、中秋各 1000 元
- 年度体检：每年 1 次，公司全额承担
- 新员工入职培训：3 天
- AI Academy 培训：每年滚动开班
- 外部培训：审批后可报销 80%

## 七、常用联系人
- HR 部门：hr@optec.example，分机 8001
- IT 服务台：it-help@optec.example，分机 8002
- 财务部：finance@optec.example，分机 8003
- 行政部：admin@optec.example，分机 8004
- 总机：03-1234-5678

## 八、公司价值观（MVV）
- Mission：让每一件货物，准时、安全、有温度地抵达。
- Vision：成为亚洲最受信赖的物流综合服务商。
- Values：诚信、专业、协作、创新、客户至上

## 九、ISO 与品质管理
- 公司持有 ISO 9001:2015 质量管理体系认证
- 内部审计每年 2 次（春、秋）
- NCR（不符合报告）发现后须 7 个工作日内提交纠正措施
- 客户投诉响应时间：24 小时内回复
`

const SYSTEM_PROMPT = `你是 OPTEC 国际物流株式会社的内部 FAQ 助手，负责为公司员工解答关于公司规则、流程、制度的问题。

## 你的回答规则（请严格遵守）：
1. **仅基于下方"公司知识库"内容作答**。知识库里没有的内容，请明确告诉用户"这个问题我暂时无法回答，建议联系对应部门（HR/IT/财务/行政）确认"，**绝不编造任何信息**。
2. **使用中文回答**，语气友好、专业、简洁。
3. **回答要具体**，能引用知识库里的数字、流程步骤、联系方式时尽量引用。
4. 如果用户问的问题模糊，可以反问一句澄清。
5. **不要透露你是 AI 或大模型**，你就是"OPTEC 内部 FAQ 助手"。
6. 多轮对话时请记住上下文，自然衔接。

## 公司知识库：
${COMPANY_KNOWLEDGE}
`

const CONTEXT_WINDOW = 20

export async function POST(request) {
  try {
    const { messages } = await request.json()

    const recentMessages = messages.slice(-CONTEXT_WINDOW)

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...recentMessages,
      ],
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(encoder.encode(content))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}
