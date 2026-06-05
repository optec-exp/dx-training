# 月度结算支援系统（毕业作品）

国际货代（空运为主、海运为辅 + EC）的**月度结算 / 对账 / 决算**支援系统。
Kintone（只读）作数据源，Supabase 存算，AI（Gemini，可换 Claude）做解析与洞察。
完整设计见 [DESIGN.md](./DESIGN.md)，变更历史见 [CHANGELOG.md](./CHANGELOG.md)。

## 已实现模块（localhost:3000）

| 路径 | 模块 | 能力 |
|---|---|---|
| `/profit` | ⑤ 利润报表 | 全社/中国/日本 毛利−贩管费=净利；小组(OS/JP DESK折叠中日/通関)×4维度按分；役員5/5；守恒校验；月份可选 |
| `/reconciliation` | ② 对账 | 上传账单 PDF → Gemini 解析 → OPT+供应商(模糊)+币种 两级匹配 Kintone 成本 → 差异工作台 |
| `/risk` | ⑧ 风控 | 单票加成率 vs 标准表(±10%)标红；各大类月均加成率；2026-06 起生效 |
| `/insights` | ⑨ AI 洞察 | 汇总数据 → Gemini 生成中日双语月度经营点评（代码算数、AI 解读） |
| `/settlement` | ⑥ 决算 | 银行残高按币种残高差额 + 银行×币种明细（现金净额勾稽为 P1） |
| `/sync-check` | ④ 同步排查 | 案件App 收入/成本 vs 入金/支付App 合计，按 OPT 检测同步bug |
| `/sync` | ↻ 同步 | 选月份一键同步案件/贩管费（Kintone 只读） |

## 技术栈
- Next.js 15.3.9（App Router）+ React 19 + TypeScript
- Supabase / Postgres（独立 `settlement` schema，与同 project 其它作品隔离）
- Kintone REST API（**全程只读**，11 个 App / 2 法人公司）
- Gemini 免费层（多模态解析账单 + 文本生成；过载自动降级）

## 本地运行
```bash
npm install
cp .env.local.example .env.local   # 填 Supabase / Gemini / Kintone 11个App凭证
npm run dev                         # http://localhost:3000
```
首次需在 Supabase SQL Editor 执行 `db/schema.sql`（建 settlement schema + 26 表 + 授权）。

## 同步数据
- 网页：`/sync` 选月份 →「全部同步」（案件 + 贩管费）
- 命令行脚本（`node scripts/xxx.mjs 2026-05`）：
  - `sync-cases.mjs` 案件→kc_cases　`sync-sga.mjs` 贩管费→sg_a_lines
  - `sync-payments.mjs` 支付明细→kc_cost_lines（对账用）　`sync-bank.mjs` 银行残高
  - `inspect-kintone.mjs` / `peek.mjs` / `check-connection.mjs` 等只读排查工具

## 路线图（P1/P2）
- **P1**：决算现金净额勾稽（入金−出金按币种）/ 对账账单原件存档 + 复核状态 + 关账门禁 / 预算录入+预实 / 三 App 同步排查④ / 资金账龄⑦ / 关账锁账③（状态机+快照冻结）/ 权限审批 / 全社 9 维度明细
- **P2**：多币种汇兑损益 / 税务 / 自然语言问数 / 人数自动抓取 / AI 换 Claude API

## 铁律
- Kintone **只读**，绝不回写；记录级解锁在 Kintone 侧。
- 对账差异**只标记**，由业务财务复核；正式锁账后快照冻结。
- 数据真实可验证（利润守恒、对账金额、银行残高差额均可对账）。
