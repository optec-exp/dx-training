# 月度结算支援系统（毕业作品）

国际货代（空运为主、海运为辅 + EC）的**月度结算 / 对账 / 决算**支援系统。
毕业作品先行，架构按生产级设计。完整设计见 [DESIGN.md](./DESIGN.md)。

## 技术栈
- Next.js 15.3.9（App Router）+ React 19 + TypeScript
- Supabase / Postgres（镜像表 + 业务表，见 `db/schema.sql`）
- Kintone REST API（**全程只读**，11 个 App / 2 法人公司）
- Gemini 免费层解析账单（未来换 Claude API）

## 模块
核心闭环：①账单 AI 解析 ②对账/差异工作台 ③关账/锁账 ④三 App 同步排查 ⑥月度决算勾稽
经营分析：⑤利润报表 ⑦资金管理 ⑧风控异常面板 ⑨AI 洞察/经营汇报
数据录入：Kintone 同步 / 预算 / 月度人数

## 本地启动
```bash
npm install
cp .env.local.example .env.local   # 填入 Supabase / Gemini / Kintone 凭证
npm run dev
```
首页为经营驾驶舱，各模块当前为骨架占位，按 DESIGN.md 路线图逐个实现。

## 数据库
在 Supabase SQL Editor 执行 `db/schema.sql` 建表（26 张）。

## 铁律
- Kintone **只读**，绝不回写；记录级解锁在 Kintone 侧执行。
- 对账差异**只标记**，由业务财务复核。
- 正式锁账后**快照冻结**，修改需解锁并留审计。
