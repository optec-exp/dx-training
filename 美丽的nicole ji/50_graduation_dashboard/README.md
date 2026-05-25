# 综合案件管理仪表盘

> 毕业项目 — C业务（Day 49-53）

## 功能说明

| 标签页 | 功能 |
|--------|------|
| 仪表盘 | KPI 卡片 + Recharts 图表（柱状/饼图/折线图） |
| 案件列表 | 搜索/筛选/排序，支持按状态筛选 |
| AI分析 | Claude API 一键分析风险 + 延迟预测 + 优先级建议 |
| 事件流 | Supabase Realtime 实时变更监听 |
| 管理 | 手动 Kintone 同步 + 操作日志 |

## 技术架构

```
Kintone ──(同步)──→ Supabase ──(Realtime)──→ 前端
                        ↑                        │
                  Claude AI ←──(分析请求)─────────┘
                        │
                  Slack ←──(高风险通知)
```

## 使用技术

- Next.js 15.3.9 + React 19 + TypeScript
- Tailwind CSS 4
- Supabase (Auth + PostgreSQL + Realtime)
- Claude API (@anthropic-ai/sdk) — claude-haiku-4-5
- Kintone REST API
- Slack Incoming Webhook (Block Kit)
- Recharts 图表库
- Vercel 部署 + Cron

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
# 编辑 .env.local 填入所有密钥

# 启动开发服务器
npm run dev
```

或双击 `开启作品50.bat`

## Supabase 建表 SQL

```sql
-- cases 表
CREATE TABLE cases (
  id              BIGSERIAL PRIMARY KEY,
  kintone_id      TEXT UNIQUE NOT NULL,
  case_number     TEXT NOT NULL DEFAULT '',
  customer_name   TEXT NOT NULL DEFAULT '',
  theme           TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT '',
  mode            TEXT NOT NULL DEFAULT '',
  etd             DATE,
  eta             DATE,
  awb_no          TEXT NOT NULL DEFAULT '',
  notes           TEXT NOT NULL DEFAULT '',
  synced_at       TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ai_analyses 表
CREATE TABLE ai_analyses (
  id               BIGSERIAL PRIMARY KEY,
  case_id          BIGINT REFERENCES cases(id) ON DELETE CASCADE,
  risk_level       TEXT NOT NULL,
  risk_score       NUMERIC NOT NULL,
  delay_prediction TEXT NOT NULL DEFAULT '',
  priority_rank    INT,
  priority_action  TEXT NOT NULL DEFAULT '',
  bottleneck       TEXT NOT NULL DEFAULT '',
  reason           TEXT NOT NULL DEFAULT '',
  analyzed_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(case_id)
);

-- sync_logs 表
CREATE TABLE sync_logs (
  id          BIGSERIAL PRIMARY KEY,
  event_type  TEXT NOT NULL,
  summary     TEXT NOT NULL DEFAULT '',
  detail      JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS 策略
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "已登录用户可读" ON cases FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "已登录用户可读" ON ai_analyses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "已登录用户可读" ON sync_logs FOR SELECT USING (auth.role() = 'authenticated');
```

## 环境变量

| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key |
| `KINTONE_SUBDOMAIN` | Kintone 子域名 |
| `KINTONE_APP_ID` | Kintone App ID |
| `KINTONE_API_TOKEN` | Kintone API Token |
| `ANTHROPIC_API_KEY` | Claude API Key |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook URL |
| `CRON_SECRET` | Vercel Cron 验证密钥 |
| `NEXT_PUBLIC_APP_URL` | 应用 URL（Cron 内部调用用） |
