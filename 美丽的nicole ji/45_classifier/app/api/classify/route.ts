import Groq from "groq-sdk";
import { NextRequest } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============================================================
// 分类类别定义
// ============================================================
const CATEGORIES = ["投诉", "询价", "感谢反馈", "紧急通知", "一般咨询", "文件申请"];

const SYSTEM_PROMPT = `你是专业的文本分类AI，为国际物流公司分析客户反馈和邮件。

将输入文本分类为以下6个类别之一，并给出每个类别的置信度评分（0到1之间，所有类别评分总和必须等于1.0）。

【类别定义】
- 投诉：客户对服务、延误、损坏等表达不满
- 询价：询问价格、报价、成本相关
- 感谢反馈：对服务表达感谢和满意
- 紧急通知：需要立即处理的紧急事项
- 一般咨询：询问流程、规则、状态等一般性问题
- 文件申请：请求提供证明、清单、发票等文件

【输出格式】必须返回如下JSON（不要有多余字段）：
{
  "main_category": "最匹配的类别名称",
  "confidence": 主类别的置信度数值（0到1之间的小数）,
  "reason": "30字以内的分类理由",
  "categories": [
    {"name": "投诉", "score": 数值},
    {"name": "询价", "score": 数值},
    {"name": "感谢反馈", "score": 数值},
    {"name": "紧急通知", "score": 数值},
    {"name": "一般咨询", "score": 数值},
    {"name": "文件申请", "score": 数值}
  ],
  "urgency": "高或中或低",
  "sentiment": "正面或中性或负面"
}

【Few-Shot示例1】
输入：你们的货物又延误了！这已经是第三次了，我们的客户非常不满，要求赔偿！
输出：{"main_category":"投诉","confidence":0.95,"reason":"多次延误导致客户强烈不满，要求赔偿","categories":[{"name":"投诉","score":0.95},{"name":"询价","score":0.01},{"name":"感谢反馈","score":0.00},{"name":"紧急通知","score":0.03},{"name":"一般咨询","score":0.01},{"name":"文件申请","score":0.00}],"urgency":"高","sentiment":"负面"}

【Few-Shot示例2】
输入：请问从东京发货到上海，100kg的话大概多少钱？
输出：{"main_category":"询价","confidence":0.93,"reason":"明确询问东京到上海货运报价，100kg规格","categories":[{"name":"投诉","score":0.01},{"name":"询价","score":0.93},{"name":"感谢反馈","score":0.00},{"name":"紧急通知","score":0.01},{"name":"一般咨询","score":0.04},{"name":"文件申请","score":0.01}],"urgency":"低","sentiment":"中性"}

【Few-Shot示例3】
输入：这次服务真的太好了！货物提前到达，你们的团队非常专业，下次还会合作！
输出：{"main_category":"感谢反馈","confidence":0.97,"reason":"货物提前到达，对服务团队高度满意","categories":[{"name":"投诉","score":0.00},{"name":"询价","score":0.00},{"name":"感谢反馈","score":0.97},{"name":"紧急通知","score":0.00},{"name":"一般咨询","score":0.02},{"name":"文件申请","score":0.01}],"urgency":"低","sentiment":"正面"}`;

// ============================================================

export async function POST(req: NextRequest) {
  const { text } = (await req.json()) as { text: string };

  if (!text || text.trim().length === 0) {
    return new Response("请输入文本", { status: 400 });
  }

  if (text.trim().length > 2000) {
    return new Response("文本过长，请控制在2000字以内", { status: 400 });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, // 低温度保证输出稳定
      response_format: { type: "json_object" }, // 强制JSON输出
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `请对以下文本进行分类：\n\n${text.trim()}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    // 解析并验证JSON
    const result = JSON.parse(raw) as {
      main_category: string;
      confidence: number;
      reason: string;
      categories: { name: string; score: number }[];
      urgency: string;
      sentiment: string;
    };

    // 确保类别顺序和字段完整
    const orderedCategories = CATEGORIES.map((name) => {
      const found = result.categories?.find((c) => c.name === name);
      return { name, score: found?.score ?? 0 };
    });

    return Response.json({
      main_category: result.main_category ?? "一般咨询",
      confidence: Math.min(1, Math.max(0, result.confidence ?? 0.5)),
      reason: result.reason ?? "无法获取理由",
      categories: orderedCategories,
      urgency: result.urgency ?? "中",
      sentiment: result.sentiment ?? "中性",
    });
  } catch (err) {
    console.error(err);
    return new Response("分类失败，请重试", { status: 500 });
  }
}
