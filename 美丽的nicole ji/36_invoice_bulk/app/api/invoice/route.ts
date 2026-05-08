import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { client, case_name, amount, note, month } = await req.json();

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif; padding: 60px; color: #333; }
    h1 { text-align: center; font-size: 28px; letter-spacing: 6px; margin-bottom: 40px; }
    .meta { text-align: right; margin-bottom: 30px; font-size: 14px; color: #555; }
    .client-box { border: 1px solid #ccc; padding: 16px 20px; margin-bottom: 30px; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 15px; }
    th { background: #f0f0f0; padding: 10px; border: 1px solid #ccc; text-align: left; }
    td { padding: 10px; border: 1px solid #ccc; }
    .total-row td { font-weight: bold; background: #fafafa; }
    .footer { margin-top: 60px; text-align: center; font-size: 13px; color: #888; }
  </style>
</head>
<body>
  <h1>发　票</h1>
  <div class="meta">
    <div>开票日期：${month}</div>
    <div>发票编号：INV-${Date.now()}</div>
  </div>
  <div class="client-box">
    <strong>客户名：</strong>${client}
  </div>
  <table>
    <thead>
      <tr>
        <th>案件名</th>
        <th>备注</th>
        <th style="text-align:right">金额（円）</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${case_name}</td>
        <td>${note}</td>
        <td style="text-align:right">¥${Number(amount).toLocaleString()}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2" style="text-align:right">合计</td>
        <td style="text-align:right">¥${Number(amount).toLocaleString()}</td>
      </tr>
    </tfoot>
  </table>
  <div class="footer">感谢您的惠顾 — OPTEC EXPRESS CO., LTD.</div>
</body>
</html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
