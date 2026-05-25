# 综合案件管理仪表盘 — AI 协作说明

## 项目概述
C业务毕业项目（Day 49-53），集成 Kintone + Supabase + Claude API + Slack + Recharts + 认证的综合案件管理系统。

## 技术栈
- **框架**: Next.js 15.3.9 + React 19 + TypeScript
- **样式**: Tailwind CSS 4
- **数据库**: Supabase（PostgreSQL + Auth + Realtime）
- **外部API**: Kintone REST API、Claude API (Anthropic SDK)、Slack Webhook
- **图表**: Recharts
- **部署**: Vercel

## 项目结构
```
app/
├── page.tsx              # 单页面应用（认证 + 5个标签页）
├── layout.tsx            # 根布局
├── globals.css           # Tailwind 导入
└── api/
    ├── sync/route.ts     # Kintone → Supabase 同步
    ├── analyze/route.ts  # Claude AI 风险分析 + 优先级建议
    ├── slack/route.ts    # Slack Block Kit 通知
    └── cron/route.ts     # Vercel 定时同步
```

## 数据库表
- `cases` — Kintone 同步的案件数据（kintone_id 为唯一键）
- `ai_analyses` — AI 分析结果缓存（case_id 为唯一键）
- `sync_logs` — 操作日志

## 环境变量
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
KINTONE_SUBDOMAIN, KINTONE_APP_ID, KINTONE_API_TOKEN
ANTHROPIC_API_KEY
SLACK_WEBHOOK_URL
CRON_SECRET, NEXT_PUBLIC_APP_URL
```

## 开发规范
- 单页面架构（page.tsx），不使用路由
- API 路由使用 service_role_key 写入数据
- 客户端使用 anon_key + RLS 读取数据
- Claude API 使用 claude-haiku-4-5 模型
- 所有中文注释
