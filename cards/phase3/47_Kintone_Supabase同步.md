# 作品47 — Kintone ↔ Supabase 自动同步

| | |
|---|---|
| **编号** | 47 |
| **工时** | L（应用）1天 |
| **Day** | Day 46 |
| **对象** | 全员 |

## 要做什么

制作将 Kintone 现有数据自动同步到 Supabase 的工具，实现现有系统与新系统的数据桥梁。

## 学习内容

- 差量更新（只同步变更部分）
- Supabase Edge Functions（定时执行）
- 现有系统 ↔ 新系统的桥梁模式

## 完成标准

- [ ] 手动触发同步时 Supabase 数据与 Kintone 一致
- [ ] 差量更新正确（已存在记录 UPDATE，新记录 INSERT）
- [ ] 同步日志记录成功/失败件数
- [ ] Vercel 部署成功

## 提交方式

```
git add .
git commit -m "作品47: Kintone ↔ Supabase 自动同步"
git push
```

Vercel 自动部署后，将公开 URL 发送到 **#optec-ai-academy**。
