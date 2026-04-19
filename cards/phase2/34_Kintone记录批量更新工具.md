# 作品34 — Kintone 记录批量更新工具（CSV → Kintone）

| | |
|---|---|
| **编号** | 34 |
| **工时** | M（基础）半天 |
| **Day** | Day 26 |
| **对象** | 全员 |

## 要做什么

制作上传 CSV 文件后批量更新 Kintone 记录的工具，显示处理结果摘要。

## 学习内容

- 文件上传（`<input type='file'>`）
- CSV 解析（`papaparse`）
- 批量处理（循环 PUT /records）
- 结果摘要（成功 N 件 / 失败 N 件）

## 完成标准

- [ ] 上传 CSV 后预览解析结果
- [ ] 确认后批量更新 Kintone
- [ ] 显示成功/失败件数摘要
- [ ] Vercel 部署成功

## 提交方式

```
git add .
git commit -m "作品34: Kintone 记录批量更新工具（CSV → Kintone）"
git push
```

Vercel 自动部署后，将公开 URL 发送到 **#optec-ai-academy**。
